import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import UnderlineExtension from '@tiptap/extension-underline';
import { 
    Bold, 
    Italic, 
    Underline, 
    Heading1, 
    Heading2, 
    Heading3, 
    List
} from 'lucide-react';
import { Button } from './ui/button';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    content, 
    onChange, 
    placeholder = "Commencez à écrire votre article..." 
}) => {
    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            BoldExtension,
            ItalicExtension,
            UnderlineExtension,
            Heading.configure({
                levels: [1, 2, 3],
            }),
            BulletList,
            ListItem,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const MenuBar = () => {
        return (
            <div className="border-b border-gray-200 p-4 bg-white rounded-t-lg">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Formatage de base */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Bold className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Italic className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={editor.isActive('underline') ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Underline className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    {/* Titres */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Heading1 className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Heading2 className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <Heading3 className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300 mx-2" />

                    {/* Listes */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' : ''}
                    >
                        <List className="w-4 h-4" />
                    </Button>


                </div>
            </div>
        );
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <MenuBar />
            <div className="relative">
                <EditorContent 
                    editor={editor} 
                    className="min-h-[400px] p-4 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:p-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-4 [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline"
                />
                {!editor.getText().trim() && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditor; 