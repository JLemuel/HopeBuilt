export class ConvexError<TData = unknown> extends Error {
  data: TData;

  constructor(data: TData) {
    super(typeof data === "string" ? data : "Mock ConvexError");
    this.name = "ConvexError";
    this.data = data;
  }
}
