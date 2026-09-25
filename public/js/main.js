// FRONT-END (CLIENT) JAVASCRIPT HERE
let  bricks = []
let brickID = 0
let selectedBrickID = -1
let userID = sessionStorage.getItem('brickWallUserID') || null

const editBrickForm = document.getElementById("brickEditForm")
const editTitle = document.getElementById('editTitle')
const editBody = document.getElementById('editBody')


async function loadBricks() {
  const response = await fetch( 'api/bricks' )
  const serverBricks = await response.json()

  if (serverBricks.length > 0) {
    bricks.push( ...serverBricks )
    bricks.forEach( displayBrick )
  }
}

function brickClicked( event ){
  const brickElement = event.currentTarget
  selectedBrickID = brickElement.dataset.id
  const selectedBrick = bricks.find( function( brick ) {
    return String(brick.id)  === selectedBrickID
  })

  document.querySelectorAll( '.brick.selected' ).forEach( function( element ) {
    element.classList.remove( 'selected' )
  })
  brickElement.classList.add( 'selected' )

  console.log( 'selectedBrickID:', selectedBrickID )
  console.log( 'Selected brick', selectedBrick )

  editTitle.placeholder = selectedBrick.title
  editBody.placeholder = selectedBrick.body


}

function drawLine(brick1, brick2) {
  if(!brick1 || !brick2){
    console.log("drawing between undefined spaces")
    return
  }
  console.log('Drawing line between', brick1, 'and', brick2)
  const svg = document.getElementById('connection')
  const wall = document.getElementById('brickWall')

  const rect1 = brick1.getBoundingClientRect()
  const rect2 = brick2.getBoundingClientRect()
  const wallRect = wall.getBoundingClientRect()

  const x1 = rect1.left - wallRect.left + rect1.width / 2
  const y1 = rect1.top - wallRect.top / 2 + rect1.height
  const x2 = rect2.left - wallRect.left + rect2.width / 2
  const y2 = rect2.top - wallRect.top / 2 + rect2.height

  console.log('Coordinates:', x1, y1, x2, y2)

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  const curveAmount = -100 * (x2-x1)/rect1.width  // Adjust this value to control the curve amount

  const controlX = midX
  const controlY = midY + curveAmount

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`)
  path.setAttribute('stroke', 'white')
  path.setAttribute('fill', 'transparent')
  path.setAttribute('stroke-width', '3')

  svg.appendChild(path)
}

async function clearWall(){
  brickID = 0
  selectedBrickID = -1

  const svg = document.getElementById('connection')
  svg.innerHTML = ''
  const body = JSON.stringify({userID: userID})

  const response = await fetch( 'api/bricks', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body
  })

  if( response.ok ) {
    const wall = document.querySelector( '#brickWall' )
    wall.innerHTML = ''
    bricks.length = 0
    bricks = [] 
  }
  
}

const clearWallButton = document.getElementById('clearWall')
if (clearWallButton) {
  clearWallButton.addEventListener('click', clearWall)
}

function createBrick( title, body ) {
  let newBrick = {
    id: brickID++,
    title: title,
    body: body,
    parentID: selectedBrickID,
    userID: userID
  }
  console.log( 'newBrick:', newBrick )
  return newBrick
}


const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()
  
  const form = event.currentTarget

  console.log("Button", form.id, "clicked")

  const formData = new FormData( form )

  if(form.id === 'editForm'){
    if(selectedBrickID == -1){
      return //No brick selected, please please please dont crash my website
    }
    //Step 1: What are we editing
    let newTitle = formData.get("title")
    let newBody = formData.get("body")
    oldBrick = bricks.find(function( brick ) {return String( brick.id ) === selectedBrickID})
    serverBrickID = oldBrick._id

    if(!newTitle){
      newTitle = oldBrick.title
    }
    if(!newBody){
      newBody = oldBrick.body
    }

    console.log("edited information gathered: step 1 complete")

    //Step 2: Replace the brick in bricks
    let newBrick = {
    id: selectedBrickID,
    title: newTitle,
    body: newBody,
    parentID: oldBrick.parentID,
    userID: userID
    }

    removeBrick(bricks, selectedBrickID)
    bricks.push(newBrick)

    console.log("Edited local storage: step 2 complete")

    //Step 3: Edit the database
    const response = await fetch(`/api/bricks/${selectedBrickID}`,{
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        body: newBody
      })
    })
    console.log("Edited server storage: step 3 complete")

    const wall = document.querySelector( '#brickWall' )
    wall.innerHTML = ''

    displayBrick(newBrick)

    console.log(response.json)
    return


  }

  else if(form.id === "loginForm"){
    const username = formData.get('username')
    const password = formData.get('password')

    const body = JSON.stringify({ username, password })

    const response = await fetch('api/login', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    console.log("login attempted, U:" , username, "P:", password)
    const data = await response.json()
    console.log(data)
    if (data.userID) {
      userID = data.userID
      sessionStorage.setItem('brickWallUserID', userID)
      window.location.href = 'firstBrick.html'
    } else {
      userID = null
      sessionStorage.removeItem('brickWallUserID')
    }
    return
  } else if(form.id === 'childBrickForm' || form.id === 'firstBrickForm'){
    brickID = bricks.length

    const brick = createBrick(
      formData.get( 'title' ),
      formData.get( 'body' )
    )

    bricks.push( brick )
    displayBrick( brick )
    //console.log( 'bricks:', bricks )

    const body = JSON.stringify( brick )

    const response = await fetch( 'api/bricks', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body 
    })

    const text = await response.text()

    console.log( 'text:', text )

    if (form.id === 'firstBrickForm') {
      window.location.href = 'wall.html'
    }
  }else{
    console.log("mystery button found")
  }
}

function removeBrick(bricks, idToRemove){
  const index = bricks.findIndex(brick => brick.id === idToRemove)
  if(index !== -1){
    bricks.splice(index, 1)
  }
}

window.onload = function() {
  loadBricks()

  const forms = document.querySelectorAll( 'form' )

  forms.forEach( function( form ) {
    form.addEventListener( 'submit', submit )
  })

}

//-----------------------------React code past this------------------------
import { useEffect, useState } from 'react';

function Brick({title, body, onBrickClick}){
  return(
    <>
    <div className="brick" onClick={onBrickClick}>
    <h2>{title}</h2>
    <p>{body}</p>
    </div>
    </>
  )
}

export default function Wall(){
  const [bricks, setBricks] = useState([]);
  const [selectedBrickID, setSelectedBrickID] = useState(null);
  const [userID, setUserID] = useState(sessionStorage.getItem("brickWallUserID"));

  
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

  //NEXT STEP: EDIT BRICK FORM

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

        <input
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
    if (id == selectedBrickID){
      setSelectedBrickID(null)
      //No bricks are yellow
    }else{
    setSelectedBrick(i)
    }
    //Make the brick selected yellow
  }

  //Need to display bricks
  //Need to create bricks from text box
  //Push bricks to server
  //Edit bricks from text box
  //Create line when brick created with selected brick (should be able to reuse code)
  useEffect(() => {
      fetchBricks();
    }, []);
  //WEB DESIGN ON RETURN
  return(
    <>
    <body>
    <div class="wallHeader">
    <button class="PageSwitch" type="button" onclick="window.location.href='firstBrick.html'">Back to home</button>
    <button type="button" id='clearWall'>Clear Wall</button>

    <p class="header">Click on a brick then lay a new brick to connect them</p>

    </div>
    <div id="brickWall">
      {bricks.map((brick) => (
        <Brick
          key={brick._id}
          brick={brick}
          selected={brick._id === selectedBrickID}
          onClick={() => handleBrickClick(brick._id)}
        />
      ))}
    </div>

    <CreateBrickForm onCreate={handleCreateBrick} />


    <svg id="connection"></svg>

  </body>
    </>
  )
}