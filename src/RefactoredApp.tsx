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
  const [entryUid, setEntryUid] = useState('');
  const [branchName, setBranch] = useState('');


  const initializeApp = useCallback(async () => {
    
    if (!app) {
      console.log("🚀 Waiting for app.");
      return;
    }

    const customField = await app?.location?.CustomField;

    if (customField) {
      customField?.frame?.updateHeight();
      customField?.frame?.enableAutoResizing();

      const entry = customField?.entry;
      console.log("🚀 Entry URL:", entry?._data?.url)

      // Set the branch.
      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);

      // Set the entry uid.
      if (entry?._data?.uid) {
        setEntryUid(entry?._data?.uid);
      }

      const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`;

      if (entry?._data?.[FIELD_AUDIENCE]) {
        if (customField?.entry?.getData?.()?.url !== '') {
          const clearUrl = getClearUrl(customField?.entry?.getData?.()?.url);
          customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(clearUrl + appendToUrl);
        }
      }

      entry?.onChange((data: any) => {
        if (entryUid) {
          const url = constructUrl(data, entry?._data?.uid)
          if (url !== '') {
            setUrl(url)
            entry.getField(FIELD_URL)?.setData(url + appendToUrl)
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
      console.log('Custom field not loaded...')
    }
  }, [app, isSaved, entryUid])


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
  
  const kms_url_not_available_message = (entryUid)
    ? 'Select value for "Audience" field to view KMS link.'
    : 'Select value for "Audience" field and then save entry to view KMS link.'
  
  const return_value = (url)
    ? <>
        <base href={getHrefUrl(branchName)} />
        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
      </>
    : <p>{kms_url_not_available_message}</p>

  return error
    ? <h3>{error}</h3>
    : <div style={contentStyle}>{return_value}</div>
}

export default App