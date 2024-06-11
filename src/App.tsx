import { useCallback, useEffect, useState } from 'react'
import ContentstackAppSdk from '@contentstack/app-sdk'

const FIELD_AUDIENCE = 'audience'
const sdp_audience = 'sdp_audience';
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

  const constructUrl = (data: any, id: any) => {
    const category = data?.[FIELD_AUDIENCE][sdp_audience]
    let formattedCategory = ''
    if (category === 'Googlers') {
      formattedCategory = `https://supportcenter.corp.google.com/techstop/article/${id}`
    }
    else if (category === 'Resolvers') {
      formattedCategory = `https://supportcenter.corp.google.com/corpengkb/article/${id}`
    }

    return `${formattedCategory}`
  }
  const initializeApp = useCallback(async () => {
    if (app) {
      const customField = await app?.location?.CustomField
      const entry = customField?.entry
      console.log(entry)
      // Update the height of the App Section
      customField?.frame?.updateHeight(24)
      entry?.onChange((data: any) => {
        // Construct the URL
        var article_id = entry._data.uid;
        const url = constructUrl(data, article_id)
        setUrl(url)
        // Update the URL to the URL Field
        // This will be used for Live Preview
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url)
      })
    }
  }, [app])

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

  return error ? <h3>{error}</h3> : <div style={contentStyle}>{url}</div>
}

export default App
