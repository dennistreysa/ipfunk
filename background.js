var filter = [ "<all_urls>" ];
var possibleHeaders = ["X-Forwarded-For", "X-Originating-IP", "X-Remote-IP", "X-Remote-Addr", "X-Real-IP", "Client-Ip", "Via"];

var enabled = false;
var headers = [];
var behaviour = "range"; // range|list
var sync = false;
var range_from = [0,0,0,0];
var range_to = [255,255,255,255];
var list = [[0,0,0,0], [1,1,1,1]];
var whitelist = [];


function filterStringArray ( array )
{
    let newArray = [];

    for ( let element of array )
    {
        let trimmed = element.trim();

        if ( trimmed )
        {
            newArray.push( trimmed );
        }
        else
        {
            /** Don't add */
        }
    }

    return newArray;
}


function stringifyIp ( ip )
{
    return ip[0] + "." + ip[1] + "." + ip[2] + "." + ip[3]
}


function generateIp ()
{
    if ( behaviour == "range" )
    {
        var ip = Array();

        for ( var i = 0; i < 4; i++ )
        {
            ip[i] = Math.floor(Math.random()*(range_to[i]-range_from[i]+1)+range_from[i]);
        }
        
        return ip;
    }
    else
    {
        return list[Math.floor(Math.random()*list.length)];
    }
}


function handleBeforeSendHeaders (data)
{
    
    if ( !enabled || (0 == headers.length) )
    {
        return {};
    }
    
    for ( let r in whitelist )
    {
        if ( data.url.match(whitelist[r]) )
        {
            return {};
        }
    }
    
    let xdata = data.requestHeaders;
    let value = 0;

    for ( let h of headers )
    {
        if ( !sync || (value == 0) )
        {
            value = stringifyIp( generateIp() );
        }
        
        xdata.push({
            "name": h,
            "value": value
        });
    }
    
    return { requestHeaders: xdata };
}


function registerListener ()
{
    chrome.webRequest.onBeforeSendHeaders.addListener( handleBeforeSendHeaders, {urls:filter}, ["blocking","requestHeaders"] );
}


function removeListener ()
{
    chrome.webRequest.onBeforeSendHeaders.removeListener( handleBeforeSendHeaders );
}


function loadDefaultSettings (callback=null)
{
    try
    {
        chrome.storage.local.set({
            "enabled": false,
            "filter": [ "<all_urls>" ],
            "headers": [ "X-Forwarded-For" ],
            "behaviour": "range",
            "sync": true,
            "range_from": [0, 0, 0, 0],
            "range_to": [255, 255, 255, 255],
            "list": [[0, 0, 0, 0], [1, 1, 1, 1]],
            "whitelist": [ "http://ignore_this_domain.com/.*" ]
        }, function(){
            /** Apply the settings */
            loadSettings(callback);
        });
    }
    catch(e)
    {
        console.log("Could not load default settings: " + e);
    }
}


function loadSettings (callback=null)
{
    try
    {
        chrome.storage.local.get(["enabled", "filter", "headers", "behaviour", "sync", "range_from", "range_to", "list", "whitelist"], function(items)
        {
            try
            {
                enabled = items["enabled"];
                filter = filterStringArray( items["filter"] );
                headers = filterStringArray( items["headers"] );
                behaviour = items["behaviour"];
                sync = items["sync"];
                range_from = items["range_from"];
                range_to = items["range_to"];
                list = items["list"];
                whitelist = filterStringArray( items["whitelist"] );

                applySettings();


                /** Update Icon */
                if ( enabled )
                {
                    chrome.browserAction.setIcon({path: "/assets/favicon-32x32.png"});
                }
                else
                {
                    chrome.browserAction.setIcon({path: "/assets/favicon-32x32-off.png"});
                }

                if ( callback )
                {
                    callback();
                }
            }
            catch(e)
            {
                loadDefaultSettings();
            }
        });

    }
    catch(e)
    {
        /** load defaults */
        console.log("resettings config ("+e+")");
        loadDefaultSettings();
    }
}


function saveSettings ()
{
    try
    {
        chrome.storage.local.set({
            "enabled": enabled,
            "filter": filter,
            "headers": headers,
            "behaviour": behaviour,
            "sync": sync,
            "range_from": range_from,
            "range_to": range_to,
            "list": list,
            "whitelist": whitelist
        }, function(){ });
    }
    catch(e)
    {
        console.log("Could not save settings: " + e);
    }
}


function applySettings()
{
    removeListener();
    
    if ( enabled )
    {
        registerListener();
    }
}


loadSettings();