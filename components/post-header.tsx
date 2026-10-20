import PostTitle from './post-title'
import { formatDate } from '../lib/site'

export default function PostHeader(props: { title: string; publishedTime?: string; modifiedTime?: string }) {
  return (
      <header className="max-w-2xl mx-auto">
        <PostTitle>{props.title}</PostTitle>
        {(props.publishedTime || props.modifiedTime) && (
          <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
            By Patrick Auld<br />
            {props.publishedTime && <>Published <time dateTime={props.publishedTime}>{formatDate(props.publishedTime)}</time></>}
            {props.publishedTime && props.modifiedTime && ' · '}
            {props.modifiedTime && <>Updated <time dateTime={props.modifiedTime}>{formatDate(props.modifiedTime)}</time></>}
          </p>
        )}
      </header>
  )
}
