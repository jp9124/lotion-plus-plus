import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../style/Note.css";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { deleteNote, saveNote } from "../api/notesApi";

const NoteEdit = () => {
  let navigate = useNavigate();
  const info = useParams();
  const noteItems = JSON.parse(localStorage.getItem("noteItems")) || [];
  const item = noteItems[info.id - 1];
  const initialItem = item || {
    title: "",
    date: new Date().toISOString(),
    content: "",
  };

  const [title, setTitle] = useState(initialItem.title);
  const [date, setDate] = useState(initialItem.date);
  const [content, setContent] = useState(initialItem.content);

  if (!item) {
    return null;
  }

  async function handleDelete() {
    const answer = window.confirm("Are you sure?");
    if (answer) {
      try {
        await deleteNote(item.id);
        localStorage.setItem(
          "noteItems",
          JSON.stringify(
            noteItems.filter((note) => note.id !== item.id)
          )
        );
        navigate("/notes/");
      } catch (error) {
        alert(error.message);
      }
      window.location.reload();
    }

  }

  async function handleSave() {
    try {
      const newList = noteItems;
      const savedNote = await saveNote({
        ...item,
        date: new Date(date).toISOString(),
        title,
        content,
      });

      newList[info.id - 1] = savedNote;
      localStorage.setItem("noteItems", JSON.stringify(newList));
      navigate("/notes/" + info.id);
      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  }
  return (
    <div className="Note">
      <div className="NoteHeader">
        <div className="NoteTitle">
          <input
            id="EditTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          ></input>
          <input
            type="datetime-local"
            value={date.substring(0, 16)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="NoteTitleButtons">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={(value) => setContent(value)}
        placeholder="Your Note Here"
      />
    </div>
  );
};

export default NoteEdit;
