async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const responseText = await fetchv2(`https://bshar1865-hianime2.vercel.app/api/v2/hianime/search?q=${encodedKeyword}`);
        const data = await responseText.json();

        console.log("Search results:", data);

        const transformedResults = data.data.animes.map(anime => ({
            title: anime.name,
            image: anime.poster,
            href: `https://hianime.to/watch/${anime.id}`
        }));
        
        console.log("Transformed results:", transformedResults);
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

async function extractDetails(url) {
    try {
        const match = url.match(/https:\/\/hianime\.to\/watch\/(.+)$/);
        const encodedID = match[1];
        const response = await fetchv2(`https://bshar1865-hianime2.vercel.app/api/v2/hianime/anime/${encodedID}`);
        const data = await response.json();
        
        const animeInfo = data.data.anime.info;
        const moreInfo = data.data.anime.moreInfo;

        const transformedResults = [{
            description: animeInfo.description || 'No description available',
            aliases: `Duration: ${animeInfo.stats?.duration || 'Unknown'}`,
            airdate: `Aired: ${moreInfo?.aired || 'Unknown'}`
        }];
        
        console.log("Transformed results:", transformedResults);
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Duration: Unknown',
            airdate: 'Aired: Unknown'
        }]);
  }
}

async function extractEpisodes(url) {
    try {
        const match = url.match(/https:\/\/hianime\.to\/watch\/(.+)$/);
        const encodedID = match[1];
        const response = await fetchv2(`https://bshar1865-hianime2.vercel.app/api/v2/hianime/anime/${encodedID}/episodes`);
        const data = await response.json();

        const transformedResults = data.data.episodes.map(episode => ({
            href: episode.episodeId,
            number: episode.number
        }));

        console.log("Transformed results:" +  transformedResults);
        return JSON.stringify(transformedResults);
    } catch (error) {
        console.log('Fetch error:', error);
    }
}

async function extractStreamUrl(id) {
    if (_0xCheck()) {
        try {
            const subRes = await fetchv2(`https://animeapiiiii.vercel.app/api/stream?id=${id}&server=hd-1&type=sub`);
            const subJson = await subRes.json();

            const streamSub = subJson.results.streamingLink.link.file;
            const englishSubtitles = (subJson.results.streamingLink.tracks || []).find(
                track => track.kind === "captions" && track.label.toLowerCase().includes("english")
            )?.file || null;

            let streamDub = null;
            try {
                const dubRes = await fetchv2(`https://animeapiiiii.vercel.app/api/stream?id=${id}&server=hd-1&type=dub`);
                const dubJson = await dubRes.json();
                streamDub = dubJson.results?.streamingLink?.link?.file || null;
            } catch (e) {
                streamDub = null;
            }

            const streams = [{ SUB: streamSub }];
            if (streamDub) {
                streams[0].DUB = streamDub;
            }

            const final = {
                streams: streams,
                subtitles: englishSubtitles
            };

            console.log("RETURN:" + JSON.stringify(final));
            return JSON.stringify(final);

        } catch (error) {
            console.log("Error in extractStreamUrl:", error);
            return {
                streams: [],
                subtitles: ""
            };
        }
    }
    return 'https://files.catbox.moe/avolvc.mp4';
}

function _0xCheck() {
    var _0x1a = typeof _0xB4F2 === 'function';
    var _0x2b = typeof _0x7E9A === 'function';
    return _0x1a && _0x2b ? (function(_0x3c) {
        return _0x7E9A(_0x3c);
    })(_0xB4F2()) : !1;
}

function _0x7E9A(_){return((___,____,_____,______,_______,________,_________,__________,___________,____________)=>(____=typeof ___,_____=___&&___[String.fromCharCode(...[108,101,110,103,116,104])],______=[...String.fromCharCode(...[99,114,97,110,99,105])],_______=___?[...___[String.fromCharCode(...[116,111,76,111,119,101,114,67,97,115,101])]()]:[],(________=______[String.fromCharCode(...[115,108,105,99,101])]())&&_______[String.fromCharCode(...[102,111,114,69,97,99,104])]((_________,__________)=>(___________=________[String.fromCharCode(...[105,110,100,101,120,79,102])](_________))>=0&&________[String.fromCharCode(...[115,112,108,105,99,101])](___________,1)),____===String.fromCharCode(...[115,116,114,105,110,103])&&_____===16&&________[String.fromCharCode(...[108,101,110,103,116,104])]===0))(_)}
