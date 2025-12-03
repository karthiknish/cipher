"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  Quotes,
  TextHOne,
  TextHTwo,
  TextHThree,
  Link as LinkIcon,
  Image as ImageIcon,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  Sparkle,
  SpinnerGap,
  Lightning,
  PencilSimple,
  ArrowsClockwise,
  CheckCircle,
  X,
  Plus,
  HighlighterCircle,
  Code,
  Minus,
} from "@phosphor-icons/react";

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface AIPrompt {
  type: "continue" | "improve" | "shorten" | "expand" | "tone" | "custom";
  label: string;
  icon: React.ElementType;
  prompt?: string;
}

const AI_PROMPTS: AIPrompt[] = [
  { type: "continue", label: "Continue writing", icon: PencilSimple },
  { type: "improve", label: "Improve writing", icon: Sparkle },
  { type: "shorten", label: "Make shorter", icon: Minus },
  { type: "expand", label: "Expand on this", icon: Plus },
  { type: "tone", label: "Make more engaging", icon: Lightning },
];

export default function BlogEditor({ content, onChange, placeholder }: BlogEditorProps) {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your blog post...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200 px-1",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-6",
      },
    },
  });

  const handleAIAssist = async (promptType: AIPrompt["type"]) => {
    if (!editor) return;

    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );
    const currentContent = editor.getText();
    
    setAiLoading(true);
    setShowAIMenu(false);

    try {
      const response = await fetch("/api/blog-ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: promptType,
          selectedText: selectedText || "",
          fullContent: currentContent,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else {
        console.error("AI assist failed:", data.error);
      }
    } catch (error) {
      console.error("AI assist error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!editor || !aiSuggestion) return;
    
    const { from, to } = editor.state.selection;
    if (from !== to) {
      // Replace selected text
      editor.chain().focus().deleteRange({ from, to }).insertContent(aiSuggestion).run();
    } else {
      // Insert at cursor
      editor.chain().focus().insertContent(aiSuggestion).run();
    }
    setAiSuggestion(null);
  };

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1 bg-gray-50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <TextB className="w-4 h-4" weight="bold" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <TextItalic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <TextUnderline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <TextStrikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <HighlighterCircle className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <TextHOne className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <TextHTwo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <TextHThree className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <ListBullets className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListNumbers className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quotes className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <TextAlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <TextAlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <TextAlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowLinkInput(!showLinkInput)}
              active={editor.isActive("link")}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg p-2 z-10 flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Enter URL..."
                  className="px-2 py-1 border border-gray-200 text-sm w-48 focus:outline-none focus:border-black"
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />
                <button
                  onClick={addLink}
                  className="px-2 py-1 bg-black text-white text-xs"
                >
                  Add
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowImageInput(!showImageInput)}
              title="Add Image"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            {showImageInput && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg p-2 z-10 flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL..."
                  className="px-2 py-1 border border-gray-200 text-sm w-48 focus:outline-none focus:border-black"
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                />
                <button
                  onClick={addImage}
                  className="px-2 py-1 bg-black text-white text-xs"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Assist */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            disabled={aiLoading}
            className="flex items-center gap-2 px-3 py-2 bg-black text-white text-xs tracking-wider hover:bg-gray-800 transition disabled:opacity-50"
          >
            {aiLoading ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkle className="w-4 h-4" />
            )}
            AI ASSIST
          </button>

          <AnimatePresence>
            {showAIMenu && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 w-52"
              >
                {AI_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.type}
                    onClick={() => handleAIAssist(prompt.type)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 transition"
                  >
                    <prompt.icon className="w-4 h-4 text-gray-500" />
                    {prompt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Suggestion Panel */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkle className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">AI Suggestion</span>
              </div>
              <div className="bg-white border border-gray-200 p-4 mb-3 text-sm">
                {aiSuggestion}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyAISuggestion}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs tracking-wider hover:bg-gray-800 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  APPLY
                </button>
                <button
                  onClick={() => handleAIAssist("improve")}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-xs tracking-wider hover:bg-gray-100 transition"
                >
                  <ArrowsClockwise className="w-4 h-4" />
                  REGENERATE
                </button>
                <button
                  onClick={() => setAiSuggestion(null)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 text-xs tracking-wider hover:text-black transition"
                >
                  <X className="w-4 h-4" />
                  DISMISS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word Count */}
      <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50">
        <span>
          {editor.getText().split(/\s+/).filter(Boolean).length} words
        </span>
        <span>
          {editor.getText().length} characters
        </span>
      </div>
    </div>
  );
}

// Toolbar Button Component
function ToolbarButton({ 
  onClick, 
  active, 
  title, 
  children 
}: { 
  onClick: () => void; 
  active?: boolean; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 transition ${
        active 
          ? "bg-black text-white" 
          : "hover:bg-gray-200 text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
