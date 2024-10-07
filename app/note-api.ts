import axios, { AxiosRequestConfig } from 'axios';

const apicoIntegrationId: string = process.env
  .NEXT_PUBLIC_APICOINTEGRATION_ID as string;
const spreadSheetId: string = process.env.NEXT_PUBLIC_SPREADSHEET_ID as string;
const sheetName: string = process.env.NEXT_PUBLIC_SHEET_NAME as string;
const sheetId: number = parseInt(process.env.NEXT_PUBLIC_SHEET_ID as string);

const apiBaseUrl = `https://api.apico.dev/v1/${apicoIntegrationId}/${spreadSheetId}`;

export interface SpreadSheetResponse {
  values: string[][];
}
export const getSpreasheetData = async () => {
  const response = await axios.get<SpreadSheetResponse>(
    `${apiBaseUrl}/values/${sheetName}`
  );
  return response.data;
};

export const appendSpreadsheetData = async (
  data: (string | string | string | string)[]
) => {
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${apiBaseUrl}/values/${sheetName}:append`,
    params: {
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      includeValuesInResponse: true,
    },
    data: {
      values: [data],
    },
  };

  const response = await axios(options);
  return response.data;
};

export const updateSpreadsheetData = async (
  index: number,
  values: (string | string | string | string)[]
) => {
  const options: AxiosRequestConfig = {
    method: 'PUT',
    url: `${apiBaseUrl}/values/${sheetName}!A${index + 1}`,
    params: {
      valueInputOption: 'USER_ENTERED',
      includeValuesInResponse: true,
    },
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_APICOINTEGRATION_ACCESS_TOKEN}`,
    },
    data: {
      values: [values],
    },
  };

  const response = await axios(options);
  return response.data;
};

export const deleteSpreadsheetRow = async (index: number) => {
  const range = {
    sheetId: sheetId,
    dimension: 'ROWS',
    startIndex: index,
    endIndex: index + 1,
  };
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${apiBaseUrl}:batchUpdate`,
    data: {
      requests: [
        {
          deleteDimension: {
            range,
          },
        },
      ],
    },
  };

  const response = await axios(options);
  return response.data;
};
