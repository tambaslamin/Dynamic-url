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

const constructUrl = (entry: any, id: string) => {
  const category = entry?.[FIELD_AUDIENCE]?.[SDP_AUDIENCE]
  // Default URL.
  let formattedUrl = "";
  if (category === 'Googlers') {
    formattedUrl = `/techstop/article/${id ?? 'entry_id'}`
  } else if (category === 'Resolvers') {
    formattedUrl = `/corpengkb/article/${id ?? 'entry_id'}`
  }
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

      // Entry URL field is already defined.
      if (entry?._data?.url !== undefined && entry?._data?.url !== "") {
        console.log("🚀 Entry URL:", entry?._data?.url);
      }

      // Set the branch.
      const branch = app?.stack?.getCurrentBranch()?.uid ?? 'main';
      setBranch(branch);

      // Store the entry uid in state: entryUid (str)
      setEntryUid(entry?._data?.uid);

      let url = "";
      let audience = null;

      // Get the audience.
      if (entry?._data?.[FIELD_AUDIENCE] && entry?._data?.[FIELD_AUDIENCE]?.['sdp_audience'] !== undefined) {
        // Get audience from entry.
        audience = entry?.[FIELD_AUDIENCE]?.[SDP_AUDIENCE]?.['sdp_audience'];
        setAudience(audience);
      }

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
        url = constructUrl(entry?._data, entry?._data?.uid);
        setUrl(url);

        if (entry?._data?.url !== url && entry?._data?.uid !== "") {
          customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(url);
        }
      } else {
        setStartingFromATemplate(true);
        console.log("This is a template. Will not populate the URL field.", entry?._data?.uid);
      }
      
      // Set the URL field anytime the audience field changes.
      entry?.onChange((data: any) => {
        if (!startingFromATemplate) {
          if (entry?._changedData?.[FIELD_AUDIENCE] && entry?._changedData?.[FIELD_AUDIENCE]?.['sdp_audience'] !== undefined) {
            audience = entry?._changedData?.[FIELD_AUDIENCE]?.['sdp_audience'];
            setAudience(audience);
          }
          
          // Determine the proper URL.
          let url = constructUrl(data, entry?._data?.uid);
          setUrl(url)

          // If calculated URL does not match URL field on entry form, then update...
          if (url !== entry?._changedData?.url && entry?._data?.uid !== "") {
            customField?.entry.getField("url", { useUnsavedSchema: true })?.setData(url);
          }
        }
      });

    } else {
      console.log("🚀 Waiting for the KMS URL custom field.")
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
  
  let kms_url_not_available_message ='';
  /*let kms_url_not_available_message = (entryUid)
  ? 'Select value for "Audience" field to view KMS link.'
  : 'Select value for "Audience" field and then save entry to view KMS link.'*/
  
  kms_url_not_available_message = 'Select value for "Audience" field and then save entry to view KMS link.'

  if (startingFromATemplate) {
    kms_url_not_available_message = 'Starting from a template: save changes to the entry first.'
  }
  const return_value = (url && url.includes("/article"))
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
