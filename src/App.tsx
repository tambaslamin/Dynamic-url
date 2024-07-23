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

  const initializeApp = useCallback(async () => {
    const customField = await app?.location?.CustomField;
    const entry = customField?.entry
    const branch = (typeof app.stack === 'undefined' || app.stack === null) ? "main" : app.stack.getCurrentBranch().uid
    // Update the height of the App Section
    customField?.frame?.enableAutoResizing()
    // Define "GET" parameters that should be appended to the URL for live preview.
    const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`

    if (entry?._data?.[FIELD_AUDIENCE]) {
      console.log("==>", customField?.entry?.getData().url)
      if (customField?.entry?.getData().url !== '') {
        let cleanUrl = customField?.entry.getData().url.replace(/\?.*$/, "");

        // Set the URL field to be the "cleanUrl" value.
        let entryCustomField = customField?.entry
        entryCustomField.getField("url")?.setData(cleanUrl)
        // Retrieve then modify the entry object.
        let newEntry = entryCustomField.getData();

        console.log("==>", newEntry, 'clear 1')

        newEntry.url = cleanUrl;

        console.log("==>", newEntry, 'clear 2')
        // const payload = {
        //   entry: newEntry
        // };
        // Perform the entry update (using the new payload).
        // await app.stack.ContentType(entryCustomField.content_type.uid).Entry(newEntry.uid).update(payload).then().catch();

        // After first save complete, re-add the live preview parameters to the URL field.
        customField?.entry.getField("url")?.setData(url + appendToUrl)
      }
    }
    // On load, set the dynamic URL if audience field is set.
    entry?.onChange((data: any) => {
      const article_id = entry._data.uid;
      if (article_id) {
        const url = constructUrl(data, article_id)
        // console.log("==>", url, appendToUrl)
        setUrl(url)
        entry.getField(FIELD_URL, { useUnsavedSchema: true })?.setData(url + appendToUrl)
      }
    })

    // On save, commit the URL without "appendToUrl".
    entry?.onSave(async (data: any) => {

      // This regex will remove all "GET" parameters (i.e., ?param1=abc&param2=abc).
      const cleanUrl = customField?.entry.getData().url.replace(/\?.*$/, "");

      console.log("==>", cleanUrl, 'cleanUrl')
      // Set the URL field to be the "cleanUrl" value.
      const entryCustomField = customField?.entry;
      entryCustomField.getField("url")?.setData(cleanUrl);

      // Retrieve then modify the entry object.
      const newEntry = entryCustomField.getData();
      newEntry.url = cleanUrl;
      const payload = {
        entry: newEntry
      };
      console.log("==>", payload?.entry?.url, 'url');

      // Perform the entry update (using the new payload).
      try {
        const data1 = await app.stack.ContentType(entryCustomField?.content_type?.uid).Entry(newEntry.uid).update(payload);
        console.log('==>', data1)
      } catch (err) {
        console.error("==>", err)
      }

      // After save complete, re-add the live preview parameters to the URL field.
      customField?.entry.getField("url")?.setData(url)
    })
  }, [app, url])



  useEffect(() => {
    console.log('umesh')
    if (typeof window !== 'undefined' && window.self === window.top) {
      setError(ERROR_MESSAGE)
    } else {
      ContentstackAppSdk.init()
        .then((appSdk) => {
          setApp(appSdk);
        })
        .catch((err) => {
          console.error("Error initializing SDK: ", err);
        });
    }
  }, []);



  useEffect(() => {
    if (app) {
      initializeApp();
    }
  }, [app, initializeApp])




  return error
    ? <h3>{error}</h3>
    : <div style={contentStyle}>
      <base href="https://supportcenter-staging.corp.google.com" />
      <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
    </div>
}

export default App
