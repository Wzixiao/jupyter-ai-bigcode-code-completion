import React, { useEffect } from 'react';

import { Box, TextField, Button} from '@mui/material';
import globalStore from "../context"

type BigcodeSettingProps = {

};


function useGlobalStore() { 
  const { accessToken, bigcodeUrl, setAccessToken, setBigcodeUrl } = globalStore; 
  return { accessToken, bigcodeUrl, setAccessToken, setBigcodeUrl }; 
} 

export function BigCodeSetting({ }: BigcodeSettingProps) {
  const  { accessToken, bigcodeUrl, setBigcodeUrl, setAccessToken } = useGlobalStore();

  useEffect(() => {
    console.log("bigcodeUrl",bigcodeUrl);
    console.log("accessToken",accessToken);
  }, [bigcodeUrl, accessToken]);

  const handleSave = () => {
  
  }

  return (
    <Box
      sx={{
        padding: 4,
        boxSizing: 'border-box',
        '& > .MuiAlert-root': { marginBottom: 2 },
        overflowY: 'auto'
      }}
    > 
      <h2 className="jp-ai-ChatSettings-header">Bigcode service url</h2>
      <TextField
          label="Bigcode service url"
          value={bigcodeUrl}
          fullWidth
          type="text"
          onChange={e => setBigcodeUrl(e.target.value)}
        />

      <h2 className="jp-ai-ChatSettings-header">Huggingface Access Token</h2>
      <TextField
          label="Huggingface Access Token"
          value={accessToken}
          fullWidth
          type="password"
          onChange={e => setAccessToken(e.target.value)}
        />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave}>
          {'Save changes'}
        </Button>
      </Box>

    </Box>
  );
}

