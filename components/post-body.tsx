import markdownStyles from './markdown-styles.module.css'

export default function PostBody(props: { content: any }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`${markdownStyles['markdown']} dark:text-dark-mode`}
        dangerouslySetInnerHTML={{ __html: props.content }}
      />
    </div>
  )
}
