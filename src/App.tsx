import { useCallback, useEffect, useState } from 'react'
import ContentstackAppSdk from '@contentstack/app-sdk'

const FIELD_AUDIENCE = 'sdp_article_audience'
const SDP_AUDIENCE = 'sdp_audience';
const FIELD_URL = 'url'
const ERROR_MESSAGE = 'This extension can only be used inside Contentstack'

const contentStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#6b5ce7',
}
function App() {
  const [error, setError] = useState<any>(null)
  const [app, setApp] = useState({} as any)
  const [url, setUrl] = useState('')

  const initializeApp = useCallback(async () => {
    if (app) {
      const customField = await app?.location?.CustomField
      const entry = customField?.entry
      // Update the height of the App Section
      customField?.frame?.enableAutoResizing()
      // On load, set dynamic URL if audience field is set.
      if (entry?._data?.[FIELD_AUDIENCE]) {
        var article_id = entry._data.uid;
        const url = constructUrl(entry._data, article_id)
        setUrl(url)
        // Update the URL to the URL Field
        // This will be used for Live Preview
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url)
      }
      customField?.frame?.enableAutoResizing()
      entry?.onChange((data: any) => {
        var article_id = entry._data.uid;
        const url = constructUrl(data, article_id)
        setUrl(url)
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url)
      })

      entry?.onSave((data: any) => {
        var article_id = entry._data.uid;
        const url = constructUrl(data, article_id)
        setUrl(url)
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url)
      })
    }
  }, [app])
  
  const constructUrl = (data: any, id: any) => {
    const category = data?.[FIELD_AUDIENCE][SDP_AUDIENCE]
    let formattedCategory = ''
    if (typeof id === 'undefined') {
      id = 'entry_id'
    }
    if (category === 'Googlers') {
      formattedCategory = `/techstop/article/${id}`
    }
    else if (category === 'Resolvers') {
      formattedCategory = `/corpengkb/article/${id}`
    }
    id = ':unique_id'
    return `${formattedCategory}`
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self === window.top) {
      setError(ERROR_MESSAGE)
    } else {
      ContentstackAppSdk.init().then((appSdk) => {
        setApp(appSdk)
        initializeApp()
      })
    }
  }, [initializeApp])

  return error ? <h3>{error}</h3> : <div style={contentStyle}><base href="https://supportcenter.corp.google.com"/><a href = {url} target = "_blank">{url}</a></div>
}

export default App