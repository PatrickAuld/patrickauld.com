import { ReactNode } from 'react';
import markdownStyles from './markdown-styles.module.css'

export default function PostBody({ content }: { content: ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={markdownStyles['markdown']}
        dangerouslySetInnerHTML={{ __html: props.content }}
      />
    </div>
  )
}
