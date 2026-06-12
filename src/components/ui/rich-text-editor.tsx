import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlineIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useEffect } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need to keep it simple
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        listItem: false,
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[150px] px-3 py-2.5 text-sm text-[#121212] outline-none prose prose-sm max-w-none [&_p]:my-1",
      },
    },
  });

  // Sync external value changes (e.g. from AI generation)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#d9d9d9] bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#1B4332]/30",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#e8e8e8] bg-[#fafafa]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded cursor-pointer transition-colors",
            editor.isActive("bold")
              ? "bg-[#1B4332] text-white"
              : "text-[#555] hover:bg-[#e8e8e8]",
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded cursor-pointer transition-colors",
            editor.isActive("italic")
              ? "bg-[#1B4332] text-white"
              : "text-[#555] hover:bg-[#e8e8e8]",
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded cursor-pointer transition-colors",
            editor.isActive("underline")
              ? "bg-[#1B4332] text-white"
              : "text-[#555] hover:bg-[#e8e8e8]",
          )}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        {editor.isEmpty && (
          <p className="absolute top-2.5 left-3 text-sm text-[#b0b0b0] pointer-events-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
