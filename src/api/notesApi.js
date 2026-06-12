const GET_NOTES_URL = process.env.REACT_APP_GET_NOTES_URL;
const SAVE_NOTE_URL = process.env.REACT_APP_SAVE_NOTE_URL;
const DELETE_NOTE_URL = process.env.REACT_APP_DELETE_NOTE_URL;

function requireConfig(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

function credentials() {
  const email = localStorage.getItem("email");
  const accessToken = localStorage.getItem("access_token");

  if (!email || !accessToken) {
    throw new Error("Missing saved Google login credentials");
  }

  return { email, accessToken };
}

function authHeaders() {
  const { email, accessToken } = credentials();

  return {
    email,
    access_token: accessToken,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }

  return body;
}

export async function getNotes() {
  requireConfig("REACT_APP_GET_NOTES_URL", GET_NOTES_URL);

  const { email } = credentials();
  const url = new URL(GET_NOTES_URL);
  url.searchParams.set("email", email);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
  });

  const body = await parseResponse(response);
  return body.notes || [];
}

export async function saveNote(note) {
  requireConfig("REACT_APP_SAVE_NOTE_URL", SAVE_NOTE_URL);

  const response = await fetch(SAVE_NOTE_URL, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(note),
  });

  const body = await parseResponse(response);
  return body.note;
}

export async function deleteNote(id) {
  requireConfig("REACT_APP_DELETE_NOTE_URL", DELETE_NOTE_URL);

  const { email } = credentials();
  const url = new URL(DELETE_NOTE_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("id", id);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseResponse(response);
}
