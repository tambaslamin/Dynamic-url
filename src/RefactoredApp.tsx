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

const getHrefUrl = (branch: string) => {
  switch (branch) {
    case 'main': {
      return 'https://supportcenter.corp.google.com'
    }
    default: {
      return 'https://supportcenter-staging.corp.google.com'
    }
  }
}

const getClearUrl = (url: string) => url.replace(/\?.*$/, "");


const constructUrl = (data: any, id: any) => {
  const category = data?.[FIELD_AUDIENCE]?.[SDP_AUDIENCE]
  let formattedCategory = ''
  if (category === 'Googlers') {
    formattedCategory = `/techstop/article/${id ?? 'entry_id'}`
  } else if (category === 'Resolvers') {
    formattedCategory = `/corpengkb/article/${id ?? 'entry_id'}`
  }
  return formattedCategory;
}


function App() {
  const [error, setError] = useState<any>(null);
  const [app, setApp] = useState({} as any);
  const [isSaved, setIsSaved] = useState(true);
  const [url, setUrl] = useState('');
  const [branchName, setBranch] = useState('');


  const initializeApp = useCallback(async () => {
    if (!app) return;
    const customField = await app?.location?.CustomField;
    if (customField && isSaved) {
      const entry = customField?.entry;
      console.log("🚀 ~ initializeApp ~ entry:", entry?._data?.url)

      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);
      customField?.frame?.enableAutoResizing();
      const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`;

      if (entry?._data?.[FIELD_AUDIENCE]) {
        if (customField?.entry?.getData?.()?.url !== '') {
          const clearUrl = getClearUrl(customField?.entry?.getData?.()?.url);
          customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(clearUrl + appendToUrl);
        }
      }

      entry?.onChange((data: any) => {
        const articleId = entry?._data?.uid;
        if (articleId) {
          const url = constructUrl(data, articleId)
          if (url !== '') {
            setUrl(url)
            entry.getField(FIELD_URL)?.setData(url + appendToUrl)
          } else {
            console.error('Not able to Create Url')
          }
        }
      });

      entry?.onSave(async () => {
        const cleanUrl = getClearUrl(customField?.entry?.getData()?.url);
        const entryCustomField = customField?.entry;
        entryCustomField.getField("url")?.setData(cleanUrl);
        const newEntry = entryCustomField.getData();
        newEntry.url = cleanUrl;
        const payload = {
          entry: newEntry
        };
        setIsSaved(false);
        try {
          await app.stack.ContentType(entryCustomField?.content_type?.uid).Entry(newEntry.uid).update(payload);
        } catch (err) {
          console.log("🚀 ~ entry?.onSave ~ err:", err)
        }
      })
    } else {
      console.error('error while loading custom-field.')
    }
  }, [app, isSaved])


  useEffect(() => {
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
  }, [])


  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  return error
    ? <h3>{error}</h3>
    : <div style={contentStyle}>
      <base href={getHrefUrl(branchName)} />
      <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
    </div>
}

export default App