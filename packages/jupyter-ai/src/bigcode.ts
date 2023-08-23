import GlobalStore from './contexts/continue-writing-context';

type resultRow = {
  generated_text: string
}

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

export const processCompletionResult = (result: resultRow[]): string => {
  if (result.length == 0){
    return ""
  }

  return result[0].generated_text.replace("<jupyter_output>", "")
}


export const sendToBigCode = async (prompt: string | null): Promise<resultRow[]> => {
  const { bigcodeUrl } = GlobalStore;
  const { accessToken } = GlobalStore;

  if (!bigcodeUrl || !accessToken || !prompt) {
    alert('BigCode service URL or Huggingface Access Token not set.');
    return new Promise((resolve, reject) => { reject('BigCode service URL or Huggingface Access Token not set.') });
  }

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
