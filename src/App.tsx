import React, {useState} from 'react';
// import logo from './logo.svg';
// import './App.css';
import SignJWT from 'jose/jwt/sign';

function App() {
  const [privateKey, setPrivateKey] = useState("");
  const [keyId, setKeyId] = useState("");
  const [teamId, setTeamId] = useState("");

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
                  "pkcs8",
                  str2ab(privateKey),
                  {name: 'ECDSA', namedCurve: 'P-256'},
                  false,
                  ['sign']
          );
      } catch (e) {
          const msg = `Error parsing private key: ${e.message}`
          console.error(msg, e);
          setError(msg);
          return;
      }

      const payload = {};
      const iat = Date.now() / 1000;
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
          const msg = `Error generating token: ${e.message}`
          console.error(msg, e);
          setError(msg);
          return;
      }
  }

  return (
    <div>
        <p>
          Private Key<br/>
          <textarea onChange={(e) => setPrivateKey(e.target.value)} value={privateKey}/>
        </p>
        <p>
          Team ID<br/>
          <input type='text' onChange={e => setTeamId(e.target.value)} value={teamId}/>
        </p>
        <p>
          Key ID<br/>
          <input type='text' onChange={e => setKeyId(e.target.value)} value={keyId}/>
        </p>
        <button type='button' onClick={generateToken}>Generate Key</button>
        {error!== null ? <pre>{error}</pre> : generatedToken !== null ? <pre>{generatedToken}</pre>: null}
    </div>
  );
}

// Thanks to https://jsfiddle.net/TheJim01/5cawhpyf/
function str2ab(str: string){
    var buffer = new Uint16Array(str.length);

    for(var idx = 0, len = str.length; idx < len; ++idx){
        buffer[idx] = str.charCodeAt(idx);
    }

    return buffer;
}

export default App;
