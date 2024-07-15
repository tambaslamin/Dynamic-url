import { useCallback, useEffect, useState } from 'react'
import ContentstackAppSdk from '@contentstack/app-sdk'

const FIELD_AUDIENCE = 'sdp_article_audience'
const SDP_AUDIENCE = 'sdp_audience';
const FIELD_URL = 'url'
const ERROR_MESSAGE = 'This extension can only be used inside Contentstack.'

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
      const branch_details = app.stack.getCurrentBranch()
      const branch = branch_details.uid
      // Update the height of the App Section
      customField?.frame?.enableAutoResizing()
      // Define "GET" parameters that should be appended to the URL for live preview.
      const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`
      
      if (entry?._data?.[FIELD_AUDIENCE]) {
        let cleanUrl = customField?.entry.getData().url.replace(/\?.*$/, "");
        // Set the URL field to be the "cleanUrl" value.
        let entryCustomField = customField?.entry
        entryCustomField.getField("url")?.setData(cleanUrl)
        // Retrieve then modify the entry object.
        let entry = entryCustomField.getData();
        entry.url = cleanUrl;
        let payload = {
          entry
        };

        // Perform the entry update (using the new payload).
        await app.stack.ContentType(entryCustomField.content_type.uid).Entry(entry.uid).update(payload).then().catch();

        // After first save complete, re-add the live preview parameters to the URL field.
        customField?.entry.getField("url")?.setData(url)
      }
      // On load, set the dynamic URL if audience field is set.
      entry?.onChange((data: any) => {
        var article_id = entry._data.uid;
        const url = constructUrl(data, article_id)
        setUrl(url)
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url + appendToUrl)
      })

      // On save, commit the URL without "appendToUrl".
      entry?.onSave(async (data: any) => {
        // This regex will remove all "GET" parameters (i.e., ?param1=abc&param2=abc).
        let cleanUrl = customField?.entry.getData().url.replace(/\?.*$/, "");
        // Set the URL field to be the "cleanUrl" value.
        let entryCustomField = customField?.entry
        entryCustomField.getField("url")?.setData(cleanUrl)

        // Retrieve then modify the entry object.
        let entry = entryCustomField.getData();
        entry.url = cleanUrl;
        let payload = {
          entry
        };

        // Perform the entry update (using the new payload).
        await app.stack.ContentType(entryCustomField.content_type.uid).Entry(entry.uid).update(payload).then().catch();

        // After save complete, re-add the live preview parameters to the URL field.
        customField?.entry.getField("url")?.setData(url)
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

  return error 
    ? <h3>{error}</h3> 
    : <div style={contentStyle}>
        <base href="https://supportcenter.corp.google.com"/>
          <a href={url} target="_blank"  rel="noopener noreferrer">{url}</a>
      </div>
}

export default App