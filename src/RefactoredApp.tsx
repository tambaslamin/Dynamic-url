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
  const [url, setUrl] = useState('');
  const [entryUid, setEntryUid] = useState('');
  const [branchName, setBranch] = useState('');
  const [audience, setAudience] = useState('');
  const [startingFromATemplate, setStartingFromATemplate] = useState(false)

  const setEntryUidAndLog = (entry: any) => {
    setEntryUid(entry?._data?.uid);
    console.log("🚀 Entry UID:", entry?._data?.uid);
  }

  const setUrlAndLog = (entry: any, changeData: any | null) => {
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

      // Set the entry uid.
      setEntryUidAndLog(entry)

      // Set the audience.
      setAudienceAndLog(entry, "appLoaded")

      // Set initial URL value.
      setUrlAndLog(entry, null)
      
      // Ignore the templates (used when cloning content)
      const templateUids : string[] = [
        'blt47ebfd8a8712fa6e', // [Template-Make a Copy] Techstop TSHC/CEKB Information Template
        'blt3ca83e4debc76229', // [Template-Make a Copy] Techstop CEKB Troubleshooting and Procedure Template
        'blt9f44d7431e5446de', // [Template-Make a Copy] Techstop TSHC Troubleshooting and Procedure Template
        'bltbc1c203878259066', // [Template-Make a Copy] Techstop Guided Workflow Template
        'blt3699fdfe4d673892' // sandbox template (testing purposes only)
      ]

      if (!templateUids.includes(entry?._data?.uid)) {
        // Entry is not a template, set the URL field on form load.
        let url = setUrlAndLog(entry?._data, entry)
        customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(url);
      } else {
        setStartingFromATemplate(true);
        console.log("This is a template. Will not populate the URL field.", entry?._data?.uid);
      }
      
      // Set the URL field anytime the audience field changes.
      entry?.onChange((data: any) => {
        console.log("🚀 Entry changed, UID is:", entry?._data?.uid)
        setAudienceAndLog(entry, "entryChanged")
        let url = setUrlAndLog(entry, data)
        entry.getField(FIELD_URL)?.setData(url)
      });

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
  
  let kms_url_not_available_message = (entryUid)
    ? 'Select value for "Audience" field to view KMS link.'
    : 'Select value for "Audience" field and then save entry to view KMS link.'

  if (startingFromATemplate) {
    kms_url_not_available_message = 'Starting from a template: save changes to the entry first.'
  }
  
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