// FRONT-END (CLIENT) JAVASCRIPT HERE


//-----------------------------React code past this------------------------
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import ReactDOM from "react-dom/client";


function Brick({brick, selected, onClick, brickRef}){
  return(
    <div
      ref={brickRef}
      className={`brick ${selected ? "selected" : ""}`} 
      onClick={onClick}>

    <h2>{brick.title}</h2>
    <p>{brick.body}</p>
    </div>
  )
}

function Login({ onLogin }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event){
    event.preventDefault();

    const response = await fetch("api/login",{
      method: "POST",
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if(data.userID){
      sessionStorage.setItem(
        "brickWallUserID",
        data.userID
      );

      onLogin(data.userID)
    }else{
      setError("Incorrect Username or Password")
    }

  }
return(
  <div className="loginPage">
    <h1>Log in to place your brick</h1>

    <form onSubmit={handleSubmit}>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(event)=>
          setUsername(event.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event)=>
          setPassword(event.target.value)
        }
      />

      <button type="submit">Login</button>
    </form>

    {error && <p>{error}</p>}
  </div>
)

}

export default function Wall(){
  const [bricks, setBricks] = useState([]);
  const [selectedBrickID, setSelectedBrickID] = useState(null);

  const [userID, setUserID] = useState(sessionStorage.getItem("brickWallUserID"));

  const brickRefs = useRef({})
 
  useEffect(() => {fetchBricks();},[]);

  useLayoutEffect(() => {drawConnections();}, [bricks]);

  async function fetchBricks(){
    const response = await fetch("/api/bricks");
    const data = await response.json();

    setBricks(data)
  }

  async function handleCreateBrick(title, body){

    const newBrick = {
      title: title,
      body: body,
      parentID: selectedBrickID,
      userID: userID
    };

    const response = await fetch("/api/bricks", {
      method: "POST",
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(newBrick)
    });

    const savedBrick = await response.json();

    setBricks(prev => [...prev, savedBrick]);

  }

  async function handleEditBrick(title, body){

    if(!selectedBrickID){
      return;
    }

    const response = await fetch(
      `/api/bricks/${selectedBrickID}`,
      {
        method: "PUT",
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          title,
          body
        })
      }
    );

    const updatedBrick = await response.json();

    setBricks(prev => 
      prev.map(brick =>
        brick._id === selectedBrickID
          ? {...brick, title, body}
          : brick
      )
    );
  }

  async function handleClearWall(){

    const response = await fetch("/api/bricks",{
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userID })
    });

    if (response.ok){
      setBricks(prev => prev.filter(brick => brick.userID !== userID));
      setSelectedBrickID(null);
    }
  }

  function EditBrickForm({brick, onEdit}){
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    function handleSubmit(event) {
      event.preventDefault();

      onEdit(title, body)
    }

    return(
      <form onSubmit={handleSubmit}>
        
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            brick
              ? brick.title
              : "Select a brick to edit"
          }  
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Edit the body here"
        />

        <button type="submit">
          Edit the selected brick
        </button>
      </form>
    );
  }

  function CreateBrickForm({ onCreate }){
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    function handleSubmit(event){
      event.preventDefault();

      onCreate(title, body);

      setTitle("");
      setBody("");
    }

    return(
      <form onSubmit={handleSubmit}>

        <input
          value = {title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of your brick..."
        />

        <textarea
          value = {body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What will you write on the wall..."
        />

        <button type="submit">
          Lay your brick  
        </button>

      </form>
    );
  }
  
  function handleBrickClick(id){
    if (id === selectedBrickID){
      setSelectedBrickID(null)
    }else{
      setSelectedBrickID(id)
    }
  }

  function drawConnections(){
    const svg = document.getElementById("connection");

    if(!svg){
      return;
    }

    svg.replaceChildren();
    const svgRect = svg.getBoundingClientRect();

    bricks.forEach((brick) => {
      if(!brick.parentID || brick.parentID === -1){
        return;
      }

      const childElement = brickRefs.current[brick._id];
      const parentElement = brickRefs.current[brick.parentID];
      if(!childElement || !parentElement){
        return;
      }

      const childRect = childElement.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();

      const x1 = parentRect.left - svgRect.left + parentRect.width / 2;
      const y1 = parentRect.top - svgRect.top;
      const x2 = childRect.left - svgRect.left + childRect.width / 2;
      const y2 = childRect.bottom - svgRect.top;

      const controlX = (x1 + x2) / 2;
      const controlY = (y1 + y2) / 2 + 80;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );

      path.setAttribute("d", `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`);

      path.setAttribute("stroke", "white");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("fill", "none");

      svg.appendChild(path);
    });
  }

  //Create line when brick created with selected brick (should be able to reuse code)
 
  //WEB DESIGN ON RETURN
  return(
    <>
      <div className="wallPage">
          <h1>Brick Wall</h1>
        <div id="brickWall">
          {bricks.map((brick) => (
            <Brick
              key={brick._id}
              brick={brick}
              selected={brick._id === selectedBrickID}
              onClick={() => handleBrickClick(brick._id)}
              brickRef={(element) => {
                brickRefs.current[brick._id] = element;
              }}
            />
          ))}
        </div>
      </div>

      <CreateBrickForm onCreate={handleCreateBrick} />
      <EditBrickForm onCreate={handleEditBrick}/>
      <button onClick={handleClearWall}>Clear wall</button>


      <svg id="connection"></svg>
    </>
  )
}

function App(){
  const[userID, setUserID] = useState(sessionStorage.getItem("brickWallUserID"));

  function handleLogin(id){
    setUserID(id);
  }

  if(!userID){
    return <Login onLogin={handleLogin}/>;
  }

  return <Wall userId={userID}/>
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <App/>
);