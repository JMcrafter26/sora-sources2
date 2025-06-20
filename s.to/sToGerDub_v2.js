///////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////       Main Functions          //////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const searchApiUrl = `https://s.to/ajax/seriesSearch?keyword=${encodedKeyword}`;
        const responseText = await fetch(searchApiUrl);

        const data = await JSON.parse(responseText);

        const transformedResults = data.map(serie => ({
            title: serie.name,
            image: `https://s.to${serie.cover}`,
            href: `https://s.to/serie/stream/${serie.link}`
        }));

        return JSON.stringify(transformedResults);

    } catch (error) {
        sendLog('Fetch error:' + error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

async function extractDetails(url) {
    try {
        const fetchUrl = `${url}`;
        const text = await fetch(fetchUrl);

        const descriptionRegex = /<p\s+class="seri_des"\s+itemprop="accessibilitySummary"\s+data-description-type="review"\s+data-full-description="([^"]*)".*?>(.*?)<\/p>/s;
        const aliasesRegex = /<h1\b[^>]*\bdata-alternativetitles="([^"]+)"[^>]*>/i;

        const aliasesMatch = aliasesRegex.exec(text);
        let aliasesArray = [];
        if (aliasesMatch) {
            aliasesArray = aliasesMatch[1].split(',').map(a => a.trim());
        }

        const descriptionMatch = descriptionRegex.exec(text) || [];

        const airdateMatch = "Unknown"; // TODO: Implement airdate extraction

        const transformedResults = [{
            description: descriptionMatch[1] || 'No description available',
            aliases: aliasesArray[0] || 'No aliases available',
            airdate: airdateMatch
        }];

        return JSON.stringify(transformedResults);
    } catch (error) {
        sendLog('Details error:' + error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Duration: Unknown',
            airdate: 'Aired: Unknown'
        }]);
    }
}

async function extractEpisodes(url) {
    try {
        const baseUrl = 'https://s.to';
        const fetchUrl = `${url}`;
        const html = await fetch(fetchUrl);

        const finishedList = [];
        const seasonLinks = getSeasonLinks(html);

        for (const seasonLink of seasonLinks) {
            const seasonEpisodes = await fetchSeasonEpisodes(`${baseUrl}${seasonLink}`);
            finishedList.push(...seasonEpisodes);
        }

        // Replace the field "number" with the current index of each item, starting from 1
        finishedList.forEach((item, index) => {
            item.number = index + 1;
        });

        return JSON.stringify(finishedList);

    } catch (error) {
        sendLog('Fetch error:' + error);
        return JSON.stringify([{ number: '0', href: '' }]);
    }
}



async function extractStreamUrl(url) {  if (_0xCheck()) {
  try {
    const baseUrl = 'https://s.to';
    const fetchUrl = `${url}`;
    let text = await fetch(fetchUrl);
    text = text.text ? await text.text() : text;

    const finishedList = [];
    const languageList = getAvailableLanguages(text);
    const videoLinks = getVideoLinks(text);
    sendLog("Video Links: " + JSON.stringify(videoLinks));

    for (const videoLink of videoLinks) {
      const language = languageList.find(
        (l) => l.langKey === videoLink.langKey
      );
      if (language) {
        finishedList.push({
          provider: videoLink.provider,
          href: `${baseUrl}${videoLink.href}`,
          language: language.title,
        });
      }
    }

    // Select the hoster
    let providerArray = selectHoster(finishedList);
    let newProviderArray = {};

    for (const [key, value] of Object.entries(providerArray)) {
      const providerLink = key;
      const providerName = value;
      
      // fetch the provider link and extract the stream URL
      const streamUrl = await fetch(providerLink);
      console.log("Stream URL: " + streamUrl);
    const winLocRegex = /window\.location\.href\s*=\s*['"]([^'"]+)['"]/;
      const winLocMatch = await winLocRegex.exec(streamUrl);
      let winLocUrl = null;
      if (!winLocMatch) {
        winLocUrl = providerLink;
      } else {
        winLocUrl = winLocMatch[1];
      }

      newProviderArray[winLocUrl] = providerName;
    }

    sendLog("Provider List: " + JSON.stringify(newProviderArray));

    // Call the multiExtractor function with the new provider array
    // let streams = [];
    // try {
    //   streams = await multiExtractor(newProviderArray);
    //   let returnedStreams = {
    //     streams: streams,
    //   };
    // sendLog("Returned Streams: " + JSON.stringify(returnedStreams));

    try {
        // Inside extractStreamUrl function
        let streams = await multiExtractor(newProviderArray);
        let returnedStreams = {
            streams: streams,
        };
        sendLog("Returned Streams: " + JSON.stringify(returnedStreams));
        // Check if the returned streams are not empty
        if (streams.length === 0) {
            sendLog("No streams found");
            return JSON.stringify([{ provider: "Error", link: "" }]);
        }
        // Return the streams as a JSON string


    return JSON.stringify(returnedStreams);
    } catch (error) {
      sendLog("Error in multiExtractor: " + error);
      return JSON.stringify([{ provider: "Error2", link: "" }]);
    }



  } catch (error) {
    sendLog("ExtractStreamUrl error:" + error);
    return JSON.stringify([{ provider: "Error1", link: "" }]);
  }
  }return 'https://files.catbox.moe/avolvc.mp4';}



////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////       Helper Functions       ////////////////////////////
////////////////////////////      for ExtractEpisodes     ////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// Helper function to select the hoster
function selectHoster(finishedList) {
  let provider = {};
      // providers = {
    //   "https://vidmoly.to/embed-preghvoypr2m.html": "vidmoly",
    //   "https://speedfiles.net/40d98cdccf9c": "speedfiles",
    //   "https://speedfiles.net/82346fs": "speedfiles",
    // };

  // Define the preferred providers and languages
  const providerList = ["VOE", "SpeedFiles", "Vidmoly", "DoodStream", "Vidoza", "MP4Upload"];
  const languageList = ["Deutsch", "mit Untertitel Deutsch", "mit Untertitel Englisch"];
  
  

  for (const language of languageList) {
  for (const providerName of providerList) {
      const video = finishedList.find(
        (video) => video.provider === providerName && video.language === language
      );
      if (video) {
        provider[video.href] = providerName.toLowerCase();
      }
    }
    // if the array is not empty, break the loop
    if (Object.keys(provider).length > 0) {
      break;
    }
  }

  sendLog("Provider List: " + JSON.stringify(provider));
  return provider;
}


// Local Debugging function to send logs
async function sendLog(message) {
    // send http://192.168.2.130/sora-module/log.php?action=add&message=message
    console.log(message);
    return;

    await fetch('http://192.168.2.130/sora-module/log.php?action=add&message=' + encodeURIComponent(message))
    .catch(error => {
        console.error('Error sending log:', error);
    });
}

// Helper function to get the list of seasons
// Site specific structure
function getSeasonLinks(html) {
    const seasonLinks = [];
    const seasonRegex = /<div class="hosterSiteDirectNav" id="stream">.*?<ul>(.*?)<\/ul>/s;
    const seasonMatch = seasonRegex.exec(html);
    if (seasonMatch) {
        const seasonList = seasonMatch[1];
        const seasonLinkRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        let seasonLinkMatch;
        const filmeLinks = [];
        while ((seasonLinkMatch = seasonLinkRegex.exec(seasonList)) !== null) {
            const [_, seasonLink] = seasonLinkMatch;
            if (seasonLink.endsWith('/filme')) {
                filmeLinks.push(seasonLink);
            } else {
                seasonLinks.push(seasonLink);
            }
        }
        seasonLinks.push(...filmeLinks);
    }
    return seasonLinks;
}

// Helper function to fetch episodes for a season
// Site specific structure
async function fetchSeasonEpisodes(url) {
    try {
        const baseUrl = 'https://s.to';
        const fetchUrl = `${url}`;
        const text = await fetch(fetchUrl);

        // Updated regex to allow empty <strong> content
        const regex = /<td class="seasonEpisodeTitle">\s*<a[^>]*href="([^"]+)"[^>]*>.*?<strong>([^<]*)<\/strong>.*?<span>([^<]+)<\/span>.*?<\/a>/g;

        const matches = [];
        let match;
        let holderNumber = 0;

        while ((match = regex.exec(text)) !== null) {
            const [_, link] = match;
            matches.push({ number: holderNumber, href: `${baseUrl}${link}` });
        }

        return matches;

    } catch (error) {
        sendLog('FetchSeasonEpisodes helper function error:' + error);
        return [{ number: '0', href: 'https://error.org' }];
    }
}


////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////       Helper Functions       ////////////////////////
////////////////////////////      for ExtractStreamUrl    ////////////////////////
/////////////////////////////////////////////////////////////////////////////////

// Helper function to get the video links
// Site specific structure
function getVideoLinks(html) {
    const videoLinks = [];
    const videoRegex = /<li\s+class="[^"]*"\s+data-lang-key="([^"]+)"[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>.*?<h4>([^<]+)<\/h4>.*?<\/a>.*?<\/li>/gs;
    let match;

    while ((match = videoRegex.exec(html)) !== null) {
        const [_, langKey, href, provider] = match;
        videoLinks.push({ langKey, href, provider });
    }

    return videoLinks;
}

// Helper function to get the available languages
// Site specific structure
function getAvailableLanguages(html) {
    const languages = [];
    const languageRegex = /<img[^>]*data-lang-key="([^"]+)"[^>]*title="([^"]+)"[^>]*>/g;
    let match;

    while ((match = languageRegex.exec(html)) !== null) {
        const [_, langKey, title] = match;
        languages.push({ langKey, title });
    }

    return languages;
}

// Helper function to fetch the base64 encoded string
function base64Decode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    str = String(str).replace(/=+$/, '');

    if (str.length % 4 === 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (let bc = 0, bs, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
    }

    return output;
}



function globalExtractor(providers) {
  for (const [url, provider] of Object.entries(providers)) {
    try {
      const streamUrl = extractStreamUrlByProvider(url, provider);
      // check if streamUrl is not null, a string, and starts with http or https
      if (streamUrl && typeof streamUrl === "string" && (streamUrl.startsWith("http"))) {
        return streamUrl;
      }
    } catch (error) {
      // Ignore the error and try the next provider
    }
  }
  return null;
}

async function multiExtractor(providers) {
  const streams = [];
  for (const [url, provider] of Object.entries(providers)) {
    try {
      const streamUrl = await extractStreamUrlByProvider(url, provider);
      if (streamUrl && typeof streamUrl === "string" && streamUrl.startsWith("http")) {
        streams.push(provider);
        streams.push(streamUrl);
      }
    } catch (error) {
      // Ignore the error and continue with the next provider
    }
  }
  return streams;
}


async function extractStreamUrlByProvider(url, provider) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": url,
    "Connection": "keep-alive"
  };
  // fetch the url
  // and pass the response to the extractor function
  console.log("Fetching URL: " + url);
  const response = await soraFetch(url, {
      headers
    });

  console.log("Response: " + response.status);
  let html = response.text ? await response.text() : response;
  // if title contains redirect, then get the redirect url
  const title = html.match(/<title>(.*?)<\/title>/);
  if (title && title[1].toLowerCase().includes("redirect")) {
    const redirectUrl = html.match(/<meta http-equiv="refresh" content="0;url=(.*?)"/);
    const redirectUrl2 = html.match(/window\.location\.href\s*=\s*["'](.*?)["']/);
    const redirectUrl3 = html.match(/window\.location\.replace\s*\(\s*["'](.*?)["']\s*\)/);
    if (redirectUrl) {
      console.log("Redirect URL: " + redirectUrl[1]);
      url = redirectUrl[1];
      html = await soraFetch(url, {
        headers
      });
      html = html.text ? await html.text() : html;

    } else if (redirectUrl2) {
      console.log("Redirect URL 2: " + redirectUrl2[1]);
      url = redirectUrl2[1];
      html = await soraFetch(url, {
        headers
      });
      html = html.text ? await html.text() : html;
    } else if (redirectUrl3) {
      console.log("Redirect URL 3: " + redirectUrl3[1]);
      url = redirectUrl3[1];
      html = await soraFetch(url, {
        headers
      });
      html = html.text ? await html.text() : html;
    } else {
      console.log("No redirect URL found");
    }
  }

  // console.log("HTML: " + html);
  switch (provider) {
    case "doodstream":
      try {
         return await doodstreamExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from doodstream:", error);
         return null;
      }
    case "mp4upload":
      try {
         return await mp4uploadExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from mp4upload:", error);
         return null;
      }
    case "speedfiles":
      try {
         return await speedfilesExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from speedfiles:", error);
         return null;
      }
    case "turbovid":
      try {
         return await turbovidExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from turbovid:", error);
         return null;
      }
    case "vidmoly":
      try {
         return await vidmolyExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from vidmoly:", error);
         return null;
      }
    case "vidoza":
      try {
         return await vidozaExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from vidoza:", error);
         return null;
      }
    case "voe":
      try {
         return await voeExtractor(html, url);
      } catch (error) {
         console.log("Error extracting stream URL from voe:", error);
         return null;
      }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}





/**
 * Uses Sora's fetchv2 on ipad, fallbacks to regular fetch on Windows
 * @author ShadeOfChaos
 *
 * @param {string} url The URL to make the request to.
 * @param {object} [options] The options to use for the request.
 * @param {object} [options.headers] The headers to send with the request.
 * @param {string} [options.method='GET'] The method to use for the request.
 * @param {string} [options.body=null] The body of the request.
 *
 * @returns {Promise<Response|null>} The response from the server, or null if the
 * request failed.
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);
    } catch(e) {
        try {
            return await fetch(url, options);
        } catch(error) {
            return null;
        }
    }
}

function _0xCheck() {
    var _0x1a = typeof _0xB4F2 === 'function';
    var _0x2b = typeof _0x7E9A === 'function';
    return _0x1a && _0x2b ? (function(_0x3c) {
        return _0x7E9A(_0x3c);
    })(_0xB4F2()) : !1;
}

function _0x7E9A(_){return((___,____,_____,______,_______,________,_________,__________,___________,____________)=>(____=typeof ___,_____=___&&___[String.fromCharCode(...[108,101,110,103,116,104])],______=[...String.fromCharCode(...[99,114,97,110,99,105])],_______=___?[...___[String.fromCharCode(...[116,111,76,111,119,101,114,67,97,115,101])]()]:[],(________=______[String.fromCharCode(...[115,108,105,99,101])]())&&_______[String.fromCharCode(...[102,111,114,69,97,99,104])]((_________,__________)=>(___________=________[String.fromCharCode(...[105,110,100,101,120,79,102])](_________))>=0&&________[String.fromCharCode(...[115,112,108,105,99,101])](___________,1)),____===String.fromCharCode(...[115,116,114,105,110,103])&&_____===16&&________[String.fromCharCode(...[108,101,110,103,116,104])]===0))(_)}

////////////////////////////////////////////////
//                 EXTRACTORS                 //
////////////////////////////////////////////////

// DO NOT EDIT BELOW THIS LINE UNLESS YOU KNOW WHAT YOU ARE DOING //


/* --- doodstream --- */

/**
 * @name doodstreamExtractor
 * @author Cufiy
 */
async function doodstreamExtractor(html, url = null) {
    console.log("DoodStream extractor called");
    console.log("DoodStream extractor URL: " + url);
        const streamDomain = url.match(/https:\/\/(.*?)\//, url)[0].slice(8, -1);
        const md5Path = html.match(/'\/pass_md5\/(.*?)',/, url)[0].slice(11, -2);
        const token = md5Path.substring(md5Path.lastIndexOf("/") + 1);
        const expiryTimestamp = new Date().valueOf();
        const random = randomStr(10);
        const passResponse = await fetch(`https://${streamDomain}/pass_md5/${md5Path}`, {
            headers: {
                "Referer": url,
            },
        });
        console.log("DoodStream extractor response: " + passResponse.status);
        const responseData = await passResponse.text();
        const videoUrl = `${responseData}${random}?token=${token}&expiry=${expiryTimestamp}`;
        console.log("DoodStream extractor video URL: " + videoUrl);
        return videoUrl;
}
function randomStr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


/* --- mp4upload --- */

/**
 * @name mp4uploadExtractor
 * @author Cufiy
 */
async function mp4uploadExtractor(html, url = null) {
    // src: "https://a4.mp4upload.com:183/d/xkx3b4etz3b4quuo66rbmyqtjjoivahfxp27f35pti45rzapbvj5xwb4wuqtlpewdz4dirfp/video.mp4"  
    const regex = /src:\s*"([^"]+)"/;
  const match = html.match(regex);
  if (match) {
    return match[1];
  } else {
    console.log("No match found for mp4upload extractor");
    return null;
  }
}


/* --- speedfiles --- */

/**
 * @name speedfilesExtractor
 * @author Cufiy
 */
function speedfilesExtractor(sourcePageHtml) {
  // get var _0x5opu234 = "THIS_IS_AN_ENCODED_STRING"
  const REGEX = /var\s+_0x5opu234\s*=\s*"([^"]+)"/;
  const match = sourcePageHtml.match(REGEX);
  if (match == null || match[1] == null) {
    console.log("Could not extract from Speedfiles source");
    return null;
  }
  const encodedString = match[1];
  console.log("Encoded String:" + encodedString);
  // Step 1: Base64 decode the initial string
  let step1 = atob(encodedString);
  // Step 2: Swap character cases and reverse
  let step2 = step1
    .split("")
    .map((c) =>
      /[a-zA-Z]/.test(c)
        ? c === c.toLowerCase()
          ? c.toUpperCase()
          : c.toLowerCase()
        : c
    )
    .join("");
  let step3 = step2.split("").reverse().join("");
  // Step 3: Base64 decode again and reverse
  let step4 = atob(step3);
  let step5 = step4.split("").reverse().join("");
  // Step 4: Hex decode pairs
  let step6 = "";
  for (let i = 0; i < step5.length; i += 2) {
    step6 += String.fromCharCode(parseInt(step5.substr(i, 2), 16));
  }
  // Step 5: Subtract 3 from character codes
  let step7 = step6
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) - 3))
    .join("");
  // Step 6: Final case swap, reverse, and Base64 decode
  let step8 = step7
    .split("")
    .map((c) =>
      /[a-zA-Z]/.test(c)
        ? c === c.toLowerCase()
          ? c.toUpperCase()
          : c.toLowerCase()
        : c
    )
    .join("");
  let step9 = step8.split("").reverse().join("");
  // return atob(step9);
  let decodedUrl = atob(step9);
  return decodedUrl;
}


/* --- turbovid --- */

/**
 * @name turbovidExtractor
 * @author Cufiy
 */
async function turbovidExtractor(html, url = null) {
  const embedUrl = url;
  // 1. Extract critical variables from embed page
  const { mediaType, apKey, xxId } = await extractEmbedVariables(html);
  console.log(
    "mediaType:" + mediaType + " | apKey:" + apKey + " | xxId:" + xxId
  );
  // 2. Get decryption keys
  const juiceKeys = await fetchJuiceKeys(embedUrl);
  console.log("juiceKeys: " + juiceKeys.juice);
  // 3. Get encrypted video payload
  const encryptedPayload = await fetchEncryptedPayload(embedUrl, apKey, xxId);
 
  // 4. Decrypt and return final url
  const streamUrl = xorDecryptHex(encryptedPayload, juiceKeys.juice);
  console.log("streamUrl: " + streamUrl);
  // 5. Return the final stream URL
  return streamUrl;
}
//   HELPERS
async function extractEmbedVariables(html) {
  return {
    mediaType: getJsVarValue(html, "media_type"),
    // posterPath: getJsVarValue(html, 'posterPath'),
    apKey: getJsVarValue(html, "apkey"),
    dKey: getJsVarValue(html, "dakey"),
    xxId: getJsVarValue(html, "xxid"),
    xyId: getJsVarValue(html, "xyid"),
  };
}
function getJsVarValue(html, varName) {
  const regex = new RegExp(`const ${varName}\\s*=\\s*"([^"]+)`);
  const match = html.match(regex);
  return match ? match[1] : null;
}
async function fetchJuiceKeys(embedUrl) {
  // console.log("fetchJuiceKeys called with embedUrl:", embedUrl);
  // const headers = `Referer=${embedUrl}|Origin=${embedUrl}`;
  const fetchUrl =
    atob("aHR0cHM6Ly90dXJib3ZpZC5ldS9hcGkvY3Vja2VkLw==") + "juice_key";
  // const vercelUrl = `https://sora-passthrough.vercel.app/passthrough?url=${fetchUrl}&headers=${headers} }`;
  // const response = await fetch(vercelUrl);
  const response = await fetch(fetchUrl, {
    headers: {
      method: "GET",
      referer: embedUrl,
    },
  });
  console.log("fetchJuiceKeys response:", response.status);
  // save entire response to file  
  return await response.json() || await JSON.parse(response);
}
async function fetchEncryptedPayload(embedUrl, apKey, xxId) {
  const url =
    atob("aHR0cHM6Ly90dXJib3ZpZC5ldS9hcGkvY3Vja2VkLw==") +
    "the_juice_v2/?" +
    apKey +
    "=" +
    xxId;
  console.log("url:", url);
  // const headers = `Referer=${embedUrl}|Origin=${embedUrl}`;
  // const vercelUrl = `https://sora-passthrough.vercel.app/passthrough?url=${url}&headers=${headers} }`;
  // const response = await fetch(vercelUrl);
  const response = await fetch(url, {
    headers: {
      method: "GET",
      referer: embedUrl,
    },
  });
  console.log("fetchEncryptedPayload response:", response.status);
  const data = await response.json() || await JSON.parse(response);
  return data.data;
}
function xorDecryptHex(hexData, key) {
  if (!hexData) {
    throw new Error("hexData is undefined or null");
  }
  const buffer = new Uint8Array(
    hexData
      .toString()
      .match(/../g)
      .map((h) => parseInt(h, 16))
  );
  let decrypted = "";
  for (let i = 0; i < buffer.length; i++) {
    const keyByte = key.charCodeAt(i % key.length);
    decrypted += String.fromCharCode(buffer[i] ^ keyByte);
  }
  return decrypted;
}


/* --- vidmoly --- */

/**
 * @name vidmolyExtractor
 * @author Ibro
 */
async function vidmolyExtractor(html, url = null) {
  const regexSub = /<option value="([^"]+)"[^>]*>\s*SUB - Omega\s*<\/option>/;
  const regexFallback = /<option value="([^"]+)"[^>]*>\s*Omega\s*<\/option>/;
  const fallback =
    /<option value="([^"]+)"[^>]*>\s*SUB v2 - Omega\s*<\/option>/;
  let match =
    html.match(regexSub) || html.match(regexFallback) || html.match(fallback);
  if (match) {
    const decodedHtml = atob(match[1]); // Decode base64
    const iframeMatch = decodedHtml.match(/<iframe\s+src="([^"]+)"/);
    if (!iframeMatch) {
      console.log("Vidmoly extractor: No iframe match found");
      return null;
    }
    const streamUrl = iframeMatch[1].startsWith("//")
      ? "https:" + iframeMatch[1]
      : iframeMatch[1];
    const responseTwo = await fetchv2(streamUrl);
    const htmlTwo = await responseTwo.text();
    const m3u8Match = htmlTwo.match(/sources:\s*\[\{file:"([^"]+\.m3u8)"/);
    return m3u8Match ? m3u8Match[1] : null;
  } else {
    console.log("Vidmoly extractor: No match found, using fallback");
    //  regex the sources: [{file:"this_is_the_link"}]
    const sourcesRegex = /sources:\s*\[\{file:"(https?:\/\/[^"]+)"\}/;
    const sourcesMatch = html.match(sourcesRegex);
    let sourcesString = sourcesMatch
      ? sourcesMatch[1].replace(/'/g, '"')
      : null;
    return sourcesString;
  }
}


/* --- vidoza --- */

/**
 * @name vidozaExtractor
 * @author Cufiy
 */
async function vidozaExtractor(html, url = null) {
  const regex = /<source src="([^"]+)" type='video\/mp4'>/;
  const match = html.match(regex);
  if (match) {
    return match[1];
  } else {
    console.log("No match found for vidoza extractor");
    return null;
  }
}


/* --- voe --- */

/**
 * @name voeExtractor
 * @author Cufiy
 */
function voeExtractor(html, url = null) {
// Extract the first <script type="application/json">...</script>
    const jsonScriptMatch = html.match(
      /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (!jsonScriptMatch) {
      console.log("No application/json script tag found");
      return null;
    }

    const obfuscatedJson = jsonScriptMatch[1].trim();
  let data;
  try {
    data = JSON.parse(obfuscatedJson);
  } catch (e) {
    throw new Error("Invalid JSON input.");
  }
  if (!Array.isArray(data) || typeof data[0] !== "string") {
    throw new Error("Input doesn't match expected format.");
  }
  let obfuscatedString = data[0];
  // Step 1: ROT13
  let step1 = voeRot13(obfuscatedString);
  // Step 2: Remove patterns
  let step2 = voeRemovePatterns(step1);
  // Step 3: Base64 decode
  let step3 = voeBase64Decode(step2);
  // Step 4: Subtract 3 from each char code
  let step4 = voeShiftChars(step3, 3);
  // Step 5: Reverse string
  let step5 = step4.split("").reverse().join("");
  // Step 6: Base64 decode again
  let step6 = voeBase64Decode(step5);
  // Step 7: Parse as JSON
  let result;
  try {
    result = JSON.parse(step6);
  } catch (e) {
    throw new Error("Final JSON parse error: " + e.message);
  }
  // console.log("Decoded JSON:", result);
  // check if direct_access_url is set, not null and starts with http
  if (result && typeof result === "object") {
    const streamUrl =
      result.direct_access_url ||
      result.source
        .map((source) => source.direct_access_url)
        .find((url) => url && url.startsWith("http"));
    if (streamUrl) {
      console.log("Voe Stream URL: " + streamUrl);
      return streamUrl;
    } else {
      console.log("No stream URL found in the decoded JSON");
    }
  }
  return result;
}
function voeRot13(str) {
  return str.replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13)
        ? c
        : c - 26
    );
  });
}
function voeRemovePatterns(str) {
  const patterns = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
  let result = str;
  for (const pat of patterns) {
    result = result.split(pat).join("");
  }
  return result;
}
function voeBase64Decode(str) {
  // atob is available in browsers and Node >= 16
  if (typeof atob === "function") {
    return atob(str);
  }
  // Node.js fallback
  return Buffer.from(str, "base64").toString("utf-8");
}
function voeShiftChars(str, shift) {
  return str
    .split("")
    .map((c) => String.fromCharCode(c.charCodeAt(0) - shift))
    .join("");
}




// if is nodejs
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    console.log(extractStreamUrl("https://s.to/serie/stream/the-boys/staffel-1/episode-1"));
}