export async function readApiResponse(response) {
  const body = await response.text()

  if (!body.trim()) {
    throw new Error('The server returned an empty response. Make sure the TradeX API is running and try again.')
  }

  try {
    return JSON.parse(body)
  } catch {
    throw new Error('The server returned an invalid response. Make sure the TradeX API is running and try again.')
  }
}
