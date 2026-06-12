import { useEffect, useState } from "react";
import Header from "../components/Header";
import "../style/styles.css";
import NoteList from "../components/NoteList";
import { v1 as uuidv1 } from "uuid";
import { Outlet, useNavigate } from "react-router-dom";
import { googleLogout } from "@react-oauth/google";
import OAuth from "../components/OAuth";
import { getNotes } from "../api/notesApi";

const Homepage = () => {
  let navigate = useNavigate();

  const [showNoteList, setShowNoteList] = useState("true");
  const [noteItems, setNoteItems] = useState([]);
  const [authenticated, setAuthenticated] = useState("false");

  async function loadNotes() {
    try {
      const notes = await getNotes();
      setNoteItems(notes);
      localStorage.setItem("noteItems", JSON.stringify(notes));
    } catch (error) {
      alert(error.message);
    }
  }

  function toggleList() {
    const newShowList = showNoteList === "true" ? "false" : "true";
    setShowNoteList(newShowList);
    localStorage.setItem("showNoteList", newShowList);
  }

  useEffect(() => {
    const savedNoteList = localStorage.getItem("showNoteList");
    const savedNoteItems = JSON.parse(localStorage.getItem("noteItems"));
    const savedAuthentication = localStorage.getItem("authenticated");

    setShowNoteList(savedNoteList ? savedNoteList : "true");
    setNoteItems(savedNoteItems ? savedNoteItems : []);
    setAuthenticated(savedAuthentication ? savedAuthentication : "false");
  }, []);

  useEffect(() => {
    if (authenticated === "true") {
      loadNotes();
    }
  }, [authenticated]);

  function addNote() {
    const currentDate = new Date();
    const newNoteItems = [
      {
        title: "Untitled",
        content: "",
        date: currentDate.toISOString(),
        id: uuidv1(),
      },
      ...noteItems,
    ];
    setNoteItems(newNoteItems);
    localStorage.setItem("noteItems", JSON.stringify(newNoteItems));
    navigate("/notes/1/edit");
  }
  function logOut() {
    googleLogout();
    localStorage.setItem("authenticated", "false");
    localStorage.removeItem("email");
    localStorage.removeItem("access_token");
    localStorage.removeItem("noteItems");
    setNoteItems([]);
    setAuthenticated("false");
  }

  return (
    <div className="page">
      <Header toggleList={toggleList} logOut={logOut} />

      <div className="main">
        {(authenticated === "true") && (
          <>
            <NoteList
              showNoteList={showNoteList}
              noteItems={noteItems}
              addNote={addNote}
            />

            <Outlet />
          </>
        )}
        {(authenticated ==="false") &&(
          <>
            <OAuth
              setAuthenticated={setAuthenticated}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Homepage;
