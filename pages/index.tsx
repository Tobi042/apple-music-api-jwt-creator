import SignJWT from 'jose/jwt/sign';
import React, {useRef, useState} from 'react';

const GeneratedToken: React.FC<{ token: string }> = ({token}) => {
    const [copyJwtSuccess, setCopyJwtSuccess] = useState<string | null>(null);
    const [copyCurlSuccess, setCopyCurlSuccess] = useState<string | null>(null);
    const jwtRef = useRef<HTMLTextAreaElement>(null);
    const curlRef = useRef<HTMLTextAreaElement>(null);

    const copyToClipboard = (ref: React.RefObject<HTMLTextAreaElement>, setter: (msg: string|null) => void) => () => {
        if (ref.current === null) {
            return;
        }
        ref.current.select();
        document.execCommand('copy');
        setter('Copied!');
        setTimeout(() => setter(null), 5000);
    };

    const generateCurlCommand = () => `curl -v -H 'Authorization: Bearer ${token}' "https://api.music.apple.com/v1/catalog/us/artists/159260351"`

    return <div>
        <p>
            Generated Token<br/>
            <textarea readOnly rows={5} cols={66} ref={jwtRef} value={token}/><br/>
            {document.queryCommandSupported('copy') &&
            <>
                <button type='button' onClick={copyToClipboard(jwtRef, setCopyJwtSuccess)} style={{marginRight: 10}}>Copy JWT to Clipboard
                </button>
                {copyJwtSuccess}
            </>}
        </p>
        <p>
            Sample CURL Call for Testing:<br/>
            <textarea readOnly rows={7} cols={66} ref={curlRef} value={generateCurlCommand()}/><br/>
            {document.queryCommandSupported('copy') &&
            <>
                <button type='button' onClick={copyToClipboard(curlRef, setCopyCurlSuccess)} style={{marginRight: 10}}>Copy CURL Command to Clipboard
                </button>
                {copyCurlSuccess}
            </>}

        </p>
    </div>;
};

const App: React.FC = () => {
    const [privateKey, setPrivateKey] = useState('');
    const [keyId, setKeyId] = useState('');
    const [teamId, setTeamId] = useState('');

    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateToken = async () => {
        setGeneratedToken(null);

        if (privateKey.trim() === '') {
            setError('Private Key must be set');
            return;
        }
        if (keyId.trim() === '') {
            setError('Key ID must be set');
            return;
        }
        if (teamId.trim() === '') {
            setError('Team ID must be set');
            return;
        }

        let key;
        try {
            key = await crypto.subtle.importKey(
                    'pkcs8',
                    decodePrivateKey(privateKey),
                    {name: 'ECDSA', namedCurve: 'P-256'},
                    false,
                    ['sign']
            );
        } catch (e) {
            const msg = `Error parsing private key: ${e.message}`;
            console.error(msg, e);
            setError(msg);
            return;
        }

        const payload = {};
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 4380 * 60 * 60;

        const instance = new SignJWT(payload);
        instance.setProtectedHeader({alg: 'ES256', kid: keyId});
        instance.setIssuer(teamId);
        instance.setIssuedAt(iat);
        instance.setExpirationTime(exp);

        try {
            const generatedToken = await instance.sign(key);
            setError(null);
            setGeneratedToken(generatedToken);
        } catch (e) {
            const msg = `Error generating token: ${e.message}`;
            console.error(msg, e);
            setError(msg);
            return;
        }
    };

    return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <div style={{width: 560}}>
                    <h3>Apple Music API Key Helper</h3>
                    <p>Generates a signed JWT in the format required by the Apple Music API for embedding in your app.
                        The whole operation is done in the browser, so no information leaves your computer.</p>
                    <p>Check out the source code <a href="https://github.com/Tobi042/apple-music-api-jwt-creator"
                                                    target="_blank" rel="nofollow noopener noreferrer">on Github</a> and
                        the hosted version <a href="https://apple-music-api-jwt-creator.vercel.app" target="_blank"
                                              rel="nofollow noopener noreferrer">on Vercel</a></p>
                    <p>
                        Private Key<br/>
                        <textarea onChange={(e) => setPrivateKey(e.target.value)} value={privateKey} rows={8}
                                  cols={66}/>
                    </p>
                    <p>
                        Key ID<br/>
                        <input type='text' onChange={e => setKeyId(e.target.value)} value={keyId}/>
                    </p>
                    <p>
                        Team ID<br/>
                        <input type='text' onChange={e => setTeamId(e.target.value)} value={teamId}/>
                    </p>
                    <button type='button' onClick={generateToken}>Generate Key</button>
                    <div style={{marginTop: 10}}>
                        {error !== null ? <pre>{error}</pre> : generatedToken !== null ?
                                <GeneratedToken token={generatedToken}/> : null}
                    </div>
                </div>
            </div>
    );
};

/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function decodePrivateKey(pem: string) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    return str2ab(binaryDerString);
}

function SafeHydrate(Component: React.FC) {
    return () => (
            <div suppressHydrationWarning>
                {typeof window === 'undefined' ? null : <Component/>}
            </div>
    );
}

export default SafeHydrate(App);
