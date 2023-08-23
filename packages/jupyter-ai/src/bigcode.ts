import GlobalStore from './contexts/continue-writing-context';

export const getCellContentTextRequiredForBigCode = (
  contexts: string[] | null
) => {
  // eslint-disable-next-line eqeqeq
  if (contexts == null) {
    return null;
  }
  const prompt = '<start_jupyter>' + contexts.join('\n');
  return prompt;
};

export const sendToBigCode = async (prompt: string | null) => {
  const { bigcodeUrl } = GlobalStore;
  const { accessToken } = GlobalStore;
  if (!bigcodeUrl || !accessToken || !prompt) {
    alert('BigCode service URL or Huggingface Access Token not set.');
    return '';
  }
  console.log(prompt);
  console.log(bigcodeUrl);
  console.log(accessToken);
  const bodyData = {
    inputs: prompt,
    stream: false,
    parameters: {
      temperature: 0.01,
      return_full_text: false,
      stop: ['<jupyter_output>']
    }
  };

  const response = fetch(bigcodeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(bodyData)
  });

  const data = (await response).json();
  return data;
};
