'use client'

/**
 * RichTextEditor — thin wrapper around react-quill.
 *
 * react-quill relies on `document` at import time, so it must not load
 * during SSR. We dynamically import with `ssr: false` and isolate the
 * "use client" boundary here, so BlogPostForm callers don't have to
 * worry about SSR concerns.
 */

import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="blog-editor-wrapper" style={{ padding: 16, color: '#94a3b8' }}>
      Loading editor…
    </div>
  ),
})

const TOOLBAR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
}

const FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'color',
  'background',
  'blockquote',
  'code-block',
  'link',
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  id?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
}: RichTextEditorProps) {
  return (
    <div className="blog-editor-wrapper" id={id}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={TOOLBAR_MODULES}
        formats={FORMATS}
      />
    </div>
  )
}
