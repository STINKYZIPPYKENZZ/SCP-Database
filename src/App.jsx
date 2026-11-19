import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import './App.css'

function App() {
  const [scp_objects, setScp_objects] = useState([])
  const [newItem, setNewItem] = useState('')
  const [newClass, setNewClass] = useState('')
  const [newContainment, setNewContainment] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [editID, setEditID] = useState(null)
  const [editItem, setEditItem] = useState('')
  const [editClass, setEditClass] = useState('')
  const [editContainment, setEditContainment] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImage, setEditImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isAdmin = session?.user?.id === '14fea13e-f54e-46dd-8cec-b1bcfafae382'
  
  useEffect(() => {
    getScp_objects()
  }, [])

  useEffect(() => {
  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function getScp_objects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('SCP_data')
      .select(`
        *,
        SCP_containment (containment),
        SCP_description (description)
      `)
      .order('id', { ascending: true })
      
    if (error) {
      console.error(error)
    } else {
      setScp_objects(data)
    }
    setLoading(false)
    console.log(scp_objects)
  }

  async function uploadImage(file) {
    const extension = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from('SCP_images')
      .upload(fileName, file)

    if (error) {
      console.error(error)
      alert(error.message)
      return null
    }

    return fileName
  }

  async function addScp() {

    if (
      !newItem ||
      !newClass ||
      !newContainment ||
      !newDescription
    ) {
      alert('Please complete all required fields')
      return
    }

    const { data, error } = await supabase
      .from('SCP_data')
      .insert([
        {
          item: newItem,
          class: newClass,
          image: newImage ? await uploadImage(newImage) : null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      return
    }

    const scpId = data.id

    await supabase
      .from('SCP_containment')
      .insert([
        {
          scp_id: scpId,
          containment: newContainment
        }
      ])

    await supabase
      .from('SCP_description')
      .insert([
        {
          scp_id: scpId,
          description: newDescription
        }
      ])

    let imageName = null

    if (newImage) {
      imageName = await uploadImage(newImage)

      if (!imageName) {
        return
      }
    }

    setNewItem('')
    setNewClass('')
    setNewContainment('')
    setNewDescription('')
    setNewImage(null)

    getScp_objects()
  }

  async function deleteScp(id) {
    const { error } = await supabase
      .from('SCP_data')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
    } else {
      getScp_objects()
    }
  }

  async function updateScp() {

    const updatedData = {
      item: editItem,
      class: editClass
    }

    if (editImage) {
      const imageName = await uploadImage(editImage)

      if (!imageName) {
        return
      }

      updatedData.image = imageName
    }

    // Update SCP_data
    const { error: dataError } = await supabase
      .from('SCP_data')
      .update(updatedData)
      .eq('id', editID)

    if (dataError) {
      console.error(dataError)
      return
    }

    // Update containment
    const { error: containmentError } = await supabase
      .from('SCP_containment')
      .update({
        containment: editContainment
      })
      .eq('scp_id', editID)

    if (containmentError) {
      console.error(containmentError)
      return
    }

    // Update description
    const { error: descriptionError } = await supabase
      .from('SCP_description')
      .update({
        description: editDescription
      })
      .eq('scp_id', editID)

    if (descriptionError) {
      console.error(descriptionError)
      return
    }

    setEditID(null)
    setEditItem('')
    setEditClass('')
    setEditContainment('')
    setEditDescription('')
    setEditImage(null)

    getScp_objects()
  }
  
  function startEdit(scp) {
    setEditID(scp.id)
    setEditItem(scp.item)
    setEditClass(scp.class)

    setEditContainment(
      scp.SCP_containment?.[0]?.containment || ''
    )

    setEditDescription(
      scp.SCP_description?.[0]?.description || ''
    )
  }

  async function loginAdmin() {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    if (error) {
      alert(error.message)
    } else {
      setPassword('')
    }
  }

  async function logoutAdmin() {
    await supabase.auth.signOut()
    setEditID(null)
  }
  
  if (loading) {
    return <h2>Loading SCP Records...</h2>
  }

  return (
    <>
      <h1>SCP Database</h1>

      {!session ? (
        <div>
          <h2>Admin Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={loginAdmin}>Login</button>
        </div>
      ) : (
        <div>
          <p>Logged in as: {session.user.email}</p>

          <button onClick={logoutAdmin}>Logout</button>
        </div>
      )}

      <p>Total SCP Records: {scp_objects.length}</p>

      {isAdmin && (
        <>
          <div>
            <h2>Add New SCP</h2>

            <label>Item</label>
            <input
              type="text"
              placeholder="Item (e.g. SCP-173)"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />

            <br />

            <label>Class</label>
            <input
              type="text"
              placeholder="Class"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            />

            <br />

            <label>Containment Procedures</label>
            <textarea
              placeholder="Containment"
              value={newContainment}
              onChange={(e) => setNewContainment(e.target.value)}
            />

            <br />

            <label>Description</label>
            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />

            <br />

            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0] || null)}
            />

            <br />

            <button onClick={addScp}>
              Add SCP
            </button>
          </div>
        </>
      )}

      {isAdmin && editID !== null && (
        <div>
          
          <h2>Edit SCP Record</h2>

          <p><strong>ID:</strong> {editID}</p>

          <br />

          <label>Item</label>
          <input
            type="text"
            value={editItem}
            onChange={(e) => setEditItem(e.target.value)}
          />

          <br />

          <label>Class</label>
          <input
            type="text"
            value={editClass}
            onChange={(e) => setEditClass(e.target.value)}
            placeholder="Class"
          />

          <br />

          <label>Containment</label>
          <textarea
            value={editContainment}
            onChange={(e) => setEditContainment(e.target.value)}
            placeholder="Containment"
          />

          <br />

          <label>Description</label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
          />

          <br />

          <label>Replace Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setEditImage(e.target.files[0] || null)}
          />

          <br />

          <button onClick={updateScp}>
            Save Changes
          </button>

          <button 
            onClick={() => {
              setEditID(null)
            }}
          >
            Cancel
          </button>

        </div>
      )}

      {scp_objects.map((scp_object) => (
        <div
          key={scp_object.id}
          style={{
            border: '1px solid #ccc',
            margin: '10px',
            padding: '10px',
            borderRadius: '5px'
          }}
        >
          <h2>{scp_object.item}</h2>

          {scp_object.image && (
            <img
              className="scp-image"
              src={
                supabase.storage
                  .from('SCP_images')
                  .getPublicUrl(scp_object.image)
                  .data.publicUrl
              }
              alt={scp_object.item}
            />
          )}

          <p>
            <strong>Class:</strong> {scp_object.class}
          </p>

          <p>
            <strong>Containment:</strong> {''}
            {scp_object.SCP_containment?.[0]?.containment || 'N/A'}
          </p>

          <p>
            <strong>Description:</strong> {''}
            {scp_object.SCP_description?.[0]?.description || 'N/A'}
          </p>

          {isAdmin && (
            <>
              <button onClick={() => deleteScp(scp_object.id)}>
                Delete
              </button>

              <button onClick={() => startEdit(scp_object)}>
                Edit
              </button>
            </>
          )}

        </div>
      ))}
    </>
  )
}

export default App
