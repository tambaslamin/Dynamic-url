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
 
  // Default URL.
  let formattedUrl = `/article/${id ?? 'entry_id'}`

  if (category === 'Googlers') {
    formattedUrl = `/techstop/article/${id ?? 'entry_id'}`
  } else if (category === 'Resolvers') {
    formattedUrl = `/corpengkb/article/${id ?? 'entry_id'}`
  }

  console.log("🚀 Constructed the URL:", formattedUrl)
  return formattedUrl;
}


function App() {
  const [error, setError] = useState<any>(null);
  const [app, setApp] = useState({} as any);
  const [isSaved, setIsSaved] = useState(true);
  const [url, setUrl] = useState('');
  const [entryUid, setEntryUid] = useState('');
  const [branchName, setBranch] = useState('');
  const [audience, setAudience] = useState('');

  const setEntryUidAndLog = (entry: any) => {
    setEntryUid(entry?._data?.uid);
    console.log("🚀 Entry UID:", entry?._data?.uid);
  }

  const setUrlAndLog = (entry: any, appendToUrl: string, changeData: any | null) => {
    let url = ''
    if (changeData !== null) {
      // Entry changed.
      console.log("🚀 setUrlAndLog - entry changed");
      url = constructUrl(changeData, entry?._data?.uid);
      setUrl(url)
    } else {
      // Entry not changed.
      console.log("🚀 setUrlAndLog - entry NOT changed");
      url = constructUrl(entry, entry?._data?.uid);
      setUrl(url)
    }

    if (url !== '') {
      console.log("🚀 Proposed entry URL:", url);
    }
    return url;
  }

  const setAudienceAndLog = (entry: any, eventType: string) => {
    let audience = null;
    if (eventType === "entryChanged") {
      if (entry?._changedData?.[FIELD_AUDIENCE] && entry?._changedData?.[FIELD_AUDIENCE]?.['sdp_audience'] !== undefined) {
        audience = entry?._changedData?.[FIELD_AUDIENCE]?.['sdp_audience'];
        setAudience(audience);
      }
    } 
    else {
      if (entry?._data?.[FIELD_AUDIENCE] && entry?._data?.[FIELD_AUDIENCE]?.['sdp_audience'] !== undefined) {
        audience = entry?.[FIELD_AUDIENCE]?.[SDP_AUDIENCE]?.['sdp_audience'];
        setAudience(audience);
      }    
    }

    console.log("🚀 Entry Audience:", audience);
    return audience;
  }

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
      if (entry?._data?.url !== 'undefined') {
        console.log("🚀 Entry URL:", entry?._data?.url);
      }

      // Set the branch.
      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);
      const appendToUrl = `?origin=gcp-na-app.contentstack.com&branch=${branch}`;

      // Set the entry uid.
      setEntryUidAndLog(entry)

      // Set the audience.
      setAudienceAndLog(entry, "appLoaded")

      // Set initial URL value.
      setUrlAndLog(entry, appendToUrl, null)
      
      // When loading entry, if audience field is set, set the...
      let url = setUrlAndLog(entry?._data, entry, appendToUrl)
      customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(url + appendToUrl);
      
      // Set the URL field anytime the audience field changes.
      entry?.onChange((data: any) => {
        console.log("🚀 Entry changed, UID is:", entry?._data?.uid)
        setAudienceAndLog(entry, "entryChanged")
        let url = setUrlAndLog(entry, appendToUrl, data)
        entry.getField(FIELD_URL)?.setData(url + appendToUrl)
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
      console.log('Custom field not yet loaded...')
    }
  }, [app])


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
  
  console.log("Return URL:", url)
  console.log("Return Audience:", audience)
  const return_value = (url && audience)
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