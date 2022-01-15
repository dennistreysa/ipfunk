function parseIp(base) {
    var ip = Array();
    ip[0] = parseInt(document.getElementById(base+"a").value);
    ip[1] = parseInt(document.getElementById(base+"b").value);
    ip[2] = parseInt(document.getElementById(base+"c").value);
    ip[3] = parseInt(document.getElementById(base+"d").value);
    return ip;
}

function fillIp(ip, base) {
    document.getElementById(base+"a").value = ip[0];
    document.getElementById(base+"b").value = ip[1];
    document.getElementById(base+"c").value = ip[2];
    document.getElementById(base+"d").value = ip[3];
}

function fillSettingsForm() {
    var bg = chrome.extension.getBackgroundPage();
    
    document.getElementById("enabled").checked = bg.enabled;
    checkFormEnabled();

    for (x in bg.possibleHeaders) {
        var h = bg.possibleHeaders[x];
        
        document.getElementById("header-"+h).checked = (bg.headers.indexOf(h) >= 0);
    }
    
    if (bg.behaviour == "range") {
        document.getElementById("behaviour-range").checked = 1;
    } else {
        document.getElementById("behaviour-list").checked = 1;
    }
    
    fillIp(bg.range_from, "ip-range-from-");
    fillIp(bg.range_to, "ip-range-to-");
    
    document.getElementById("ip-list").value = "";
    for (ip in bg.list) {
        document.getElementById("ip-list").value += bg.stringifyIp( bg.list[ip] ) + "\n";
    }
    document.getElementById("whitelist").value = bg.whitelist.join("\n");
    
    document.getElementById("behaviour-sync-ips").checked = bg.sync;
}

function str2IpPart(str)
{
    str = str.trim();

    if ( /^\d+$/.test(str) )
    {
        let value = parseInt(str);

        if ( (0 <= value) && (value <= 255) )
        {
            return value;
        }
        else
        {
            throw "Invalid value"
        }
    }
    else
    {
        throw "Not digits-only"
    }
}

function parseIpFromString ( ip )
{
    let retVal = null;
    
    try
    {
        let parts = ip.split(".");

        if ( parts.length == 4 )
        {
            retVal = [ str2IpPart(parts[0]), str2IpPart(parts[1]), str2IpPart(parts[2]), str2IpPart(parts[3]) ];
        }
    }
    catch(e)
    {
        /** return null */
    }

    return retVal;
} 

function submitSettings() {

    var bg = chrome.extension.getBackgroundPage();
    bg.headers = [];
    for (x in bg.possibleHeaders) {
        var h = bg.possibleHeaders[x];
        if (document.getElementById("header-"+h).checked) {
            bg.headers.push( h );
        }
    }
    
    bg.enabled = document.getElementById("enabled").checked;
    
    if (document.getElementById("behaviour-range").checked) {
        bg.behaviour = "range";
    } else {
        bg.behaviour = "list";
    }
    bg.range_from = parseIp("ip-range-from-");
    bg.range_to = parseIp("ip-range-to-");
    
    bg.list = Array();
    var inlist = document.getElementById("ip-list").value.split("\n");
    
    for ( line of inlist )
    {
        line = line.trim();

        if ( line )
        {
            let ip = parseIpFromString( line );

            if ( ip )
            {
                bg.list.push( ip );
            }
        }
    }
    
    if (document.getElementById("behaviour-sync-ips").checked) {
        bg.sync = true;
    } else {
        bg.sync = false;
    }
    
    bg.whitelist = document.getElementById("whitelist").value.split("\n");
    
    bg.saveSettings();

    bg.loadSettings(function(){
        document.getElementById("status").innerHTML = "saved.";
    });

    return false;
}

function checkFormEnabled() {
    var bg = chrome.extension.getBackgroundPage();
    var d = document.getElementById("enabled");
    var fieldsets = document.getElementsByTagName("fieldset");
    for (f in fieldsets) {
        fieldsets[f].disabled = !d.checked;
    }
    bg.enabled = d.checked;
}

document.getElementById("enabled").onclick = checkFormEnabled;
document.getElementById("form").onsubmit = submitSettings;
document.getElementById("reset-config").onclick = function() {
    var bg = chrome.extension.getBackgroundPage();
    bg.loadDefaultSettings( function(){
        fillSettingsForm();
        checkFormEnabled();
    });
}

fillSettingsForm();
checkFormEnabled();