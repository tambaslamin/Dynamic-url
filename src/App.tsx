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
      let url = customField?.entry.getData().url;
      const newSlug = `${url}?origin=gcp&preview=x`
      console.log("newslug" + newSlug)
      console.log(entry.getField("url"));
      entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(newSlug)
      //customField?.entry.getField("url")?.setData(newSlug)
      console.log(customField?.entry.getData().url);
      // On load, set dynamic URL if audience field is set.
      entry?.onChange((data: any) => {
        var article_id = entry._data.uid;
        const url = constructUrl(data, article_id)
        setUrl(url)
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url)
      })
      entry?.onSave((data: any) => {
        var article_id = entry._data.uid;
        let parsedUrl = customField?.entry.getData().url.replace(/\?.*$/, "");
        let entryCustomField = customField?.entry
        entryCustomField.getField("url")?.setData(newSlug)
        entry.url = parsedUrl;
        let payload = {
          entry
        };
        customField?.ContentType(entryCustomField.content_type.uid).Entry(entry.uid).update(payload).then().catch();
        //const url = constructUrl(data, article_id)
        //setUrl(url)
        customField?.entry.getField("url")?.setData(newSlug)
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