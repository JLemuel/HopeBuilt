import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { ShoppingBag, PackageSearch, Check, AlertTriangle, Video, Image, ArrowUpDown, Calendar, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";

type ProductPreview = {
  shopifyId: number;
  title: string;
  description: string;
  slug: string;
  hasVideo: boolean;
  videoUrl: string | null;
  thumbnailUrl: string | null;
};

type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ title: string; error: string }>;
};

const STORAGE_KEY_PRODUCTS = "shopify_import_products";
const STORAGE_KEY_SELECTED = "shopify_import_selected";

function loadCachedProducts(): { products: ProductPreview[]; selectedIds: Set<number> } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return null;
    const products = JSON.parse(raw) as ProductPreview[];
    const selRaw = sessionStorage.getItem(STORAGE_KEY_SELECTED);
    const selectedIds = selRaw
      ? new Set(JSON.parse(selRaw) as number[])
      : new Set(products.map((p) => p.shopifyId));
    return { products, selectedIds };
  } catch {
    return null;
  }
}

function saveCachedProducts(products: ProductPreview[]) {
  sessionStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function saveCachedSelected(ids: Set<number>) {
  sessionStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify([...ids]));
}

export default function ShopifyImportPage() {
  const previewProducts = useAction(api.shopify.importCampaigns.previewProducts);
  const importProducts = useAction(api.shopify.importCampaigns.importProducts);

  // Restore from session storage only on first render via lazy initializers
  const [products, setProducts] = useState<ProductPreview[]>(() => {
    const cached = loadCachedProducts();
    return cached?.products ?? [];
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    const cached = loadCachedProducts();
    if (cached) return cached.selectedIds;
    return new Set<number>();
  });
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");
  const [timeFrame, setTimeFrame] = useState<string>("60");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(() => loadCachedProducts() !== null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLoadProducts = async () => {
    setLoadingPreview(true);
    setImportResult(null);
    // Clear cached data so we always get fresh results from Shopify
    sessionStorage.removeItem(STORAGE_KEY_PRODUCTS);
    sessionStorage.removeItem(STORAGE_KEY_SELECTED);
    try {
      // Compute the created_at_min date based on the selected time frame
      let createdAtMin: string | undefined;
      if (timeFrame !== "all") {
        const days = parseInt(timeFrame, 10);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        createdAtMin = cutoff.toISOString();
      }

      const result = await previewProducts({ createdAtMin });
      setProducts(result.products);
      saveCachedProducts(result.products);
      // Auto-select all products
      const allIds = new Set(result.products.map((p) => p.shopifyId));
      setSelectedIds(allIds);
      saveCachedSelected(allIds);
      setHasLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      toast.error(message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCachedSelected(next);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      const empty = new Set<number>();
      setSelectedIds(empty);
      saveCachedSelected(empty);
    } else {
      const all = new Set(products.map((p) => p.shopifyId));
      setSelectedIds(all);
      saveCachedSelected(all);
    }
  };

  const handleImport = async () => {
    setConfirmOpen(false);
    setImporting(true);
    setImportResult(null);
    try {
      const toImport = products
        .filter((p) => selectedIds.has(p.shopifyId))
        .map((p) => ({
          shopifyId: p.shopifyId,
          title: p.title,
          description: p.description,
          slug: p.slug,
          videoUrl: p.videoUrl,
          thumbnailUrl: p.thumbnailUrl,
        }));

      const result = await importProducts({ products: toImport });
      setImportResult(result);

      if (result.imported > 0) {
        toast.success(`Successfully synced ${result.imported} campaign${result.imported > 1 ? "s" : ""}`);
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} updated (already existed)`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} failed to sync`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = selectedIds.size;

  // Subscribe to real-time sync progress from the database
  const syncProgress = useQuery(api.shopify.importHelpers.getProgress, {});
  const isProgressRunning = syncProgress?.status === "running";

  // Derive filtered + sorted list from products, searchQuery and sortOrder
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter((p) => p.title.toLowerCase().includes(normalizedQuery))
    : products;
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    return sortOrder === "oldest"
      ? a.shopifyId - b.shopifyId
      : b.shopifyId - a.shopifyId;
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shopify Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sync products from Shopify as draft campaigns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={timeFrame}
            onValueChange={setTimeFrame}
            disabled={loadingPreview || importing}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm cursor-pointer">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="cursor-pointer">Last 7 days</SelectItem>
              <SelectItem value="14" className="cursor-pointer">Last 14 days</SelectItem>
              <SelectItem value="30" className="cursor-pointer">Last 30 days</SelectItem>
              <SelectItem value="60" className="cursor-pointer">Last 60 days</SelectItem>
              <SelectItem value="90" className="cursor-pointer">Last 90 days</SelectItem>
              <SelectItem value="180" className="cursor-pointer">Last 6 months</SelectItem>
              <SelectItem value="365" className="cursor-pointer">Last year</SelectItem>
              <SelectItem value="all" className="cursor-pointer">All time</SelectItem>
            </SelectContent>
          </Select>

          {!hasLoaded ? (
            <Button
              onClick={handleLoadProducts}
              disabled={loadingPreview}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              {loadingPreview ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Connecting...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Load Products
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleLoadProducts}
              disabled={loadingPreview || importing}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              {loadingPreview ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Refreshing...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Re-sync
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Loading state — real-time progress bar */}
      {(loadingPreview || importing) && isProgressRunning && syncProgress && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
              <Spinner className="h-6 w-6 text-[#1B4332]" />
              <div className="w-full space-y-3">
                {syncProgress.label === "Fetching product list" ? (
                  <>
                    {/* Phase 1: discovering products — show growing total */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {syncProgress.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {syncProgress.total > 0 ? `${syncProgress.total} found` : "..."}
                      </span>
                    </div>
                    <Progress value={0} className="h-2.5 animate-pulse" />
                    <p className="text-xs text-muted-foreground text-center">
                      Connecting to Shopify and counting products...
                    </p>
                  </>
                ) : (
                  <>
                    {/* Phase 2+: loading assets or importing — show current/total */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {syncProgress.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {syncProgress.current}/{syncProgress.total}
                      </span>
                    </div>
                    <Progress
                      value={syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}
                      className="h-2.5"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {syncProgress.phase === "preview"
                        ? "Fetching products and media from Shopify..."
                        : "Downloading media and creating draft campaigns..."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback loading state (before progress row is created) */}
      {(loadingPreview || importing) && !isProgressRunning && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-6 w-6 text-[#1B4332]" />
              <p className="text-sm text-muted-foreground">
                Connecting to Shopify...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state — before loading */}
      {!hasLoaded && !loadingPreview && (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBag />
                </EmptyMedia>
                <EmptyTitle>Connect to Shopify</EmptyTitle>
                <EmptyDescription>
                  Click the button above to fetch all products from your Shopify store. Each product will be synced as a draft campaign with its video, title, and description.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {hasLoaded && products.length === 0 && !loadingPreview && (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageSearch />
                </EmptyMedia>
                <EmptyTitle>No products found</EmptyTitle>
                <EmptyDescription>
                  Your Shopify store does not have any products, or the API connection may not be configured correctly.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={handleLoadProducts}
                  className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
                >
                  Retry
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      {hasLoaded && products.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Checkbox
                checked={selectedIds.size === products.length}
                onCheckedChange={toggleAll}
                className="cursor-pointer shrink-0"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {normalizedQuery
                  ? `${sortedProducts.length} of ${products.length}`
                  : `${selectedCount} of ${products.length} selected`}
              </span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title..."
                  className="h-8 pl-8 pr-8 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortOrder}
                onValueChange={(val) => setSortOrder(val as "oldest" | "newest")}
              >
                <SelectTrigger className="w-[140px] h-8 text-sm cursor-pointer">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oldest" className="cursor-pointer">Oldest first</SelectItem>
                  <SelectItem value="newest" className="cursor-pointer">Newest first</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLoadProducts}
                disabled={loadingPreview}
                className="text-muted-foreground cursor-pointer"
              >
                {loadingPreview ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
              <Button
                size="sm"
                disabled={selectedCount === 0 || importing}
                onClick={() => setConfirmOpen(true)}
                className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
              >
                {importing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Syncing...
                  </>
                ) : (
                  `Sync ${selectedCount} as Drafts`
                )}
              </Button>
            </div>
          </div>

          {/* Import results banner */}
          {importResult && (
            <Card className={cn(
              "border-l-4",
              importResult.failed > 0
                ? "border-l-amber-500"
                : "border-l-emerald-500",
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {importResult.failed > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Check className="h-5 w-5 text-emerald-500" />
                  )}
                  Sync Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>{importResult.imported} synced as drafts</p>
                {importResult.skipped > 0 && (
                  <p>{importResult.skipped} updated (already existed)</p>
                )}
                {importResult.failed > 0 && (
                  <div>
                    <p className="text-amber-600 font-medium">{importResult.failed} failed:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {importResult.errors.map((e, i) => (
                        <li key={i}>
                          <span className="font-medium">{e.title}</span>: {e.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product cards */}
          {sortedProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>No matches</EmptyTitle>
                    <EmptyDescription>
                      No products match "{searchQuery}". Try a different search term.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchQuery("")}
                      className="cursor-pointer"
                    >
                      Clear search
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedProducts.map((product) => {
              const isSelected = selectedIds.has(product.shopifyId);
              return (
                <div
                  key={product.shopifyId}
                  onClick={() => toggleProduct(product.shopifyId)}
                  className={cn(
                    "relative bg-card border rounded-lg overflow-hidden transition-colors cursor-pointer",
                    isSelected
                      ? "border-[#1B4332]/40 ring-1 ring-[#1B4332]/20"
                      : "border-border hover:border-border/70",
                  )}
                >
                  {/* Media preview */}
                  <div className="relative w-full aspect-video bg-muted">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}

                    {/* Video play icon overlay */}
                    {product.hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Media badges */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {product.hasVideo && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded px-1.5 py-0.5 shadow-sm">
                          <Video className="w-3 h-3" />
                          MP4
                        </span>
                      )}
                      {product.thumbnailUrl && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-600 text-white rounded px-1.5 py-0.5 shadow-sm">
                          <Image className="w-3 h-3" />
                          IMG
                        </span>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProduct(product.shopifyId)}
                        className="bg-white/80 border-white/60 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {product.description || "No description"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      /{product.slug}
                    </p>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync {selectedCount} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sync {selectedCount} Shopify product{selectedCount > 1 ? "s" : ""} as draft campaigns. Videos and thumbnails will be downloaded and stored. If a campaign already exists with the same title, it will be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              Start Sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
