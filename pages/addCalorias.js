import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback, Fragment } from "react";
import Navbar from "/components/Navbar";
import Footer from "/components/Footer";
import CardProducto from "/components/CardProducto";
import SeleccionarProducto from "/components/SeleccionarProducto";
import supabase from "../config/supabaseClient";

export default function Home() {
  const router = useRouter();
  let registroIndex = router.query.registro;

  const [sesion, setSesion] = useState(null);
  const [registro, setRegistro] = useState(null);
  const [formInput, setFormInput] = useState();
  const [productosRegistro, setProductosRegistro] = useState([])
  const [toggleSeleccionar, setToggleSeleccionar] = useState(false);

  useEffect(() => {
    localStorage.removeItem("NombrePaquete");
    localStorage.removeItem("Meses");
    handleSesion()
  }, [])

  const handleSesion = async () => {

    if (!registroIndex) {
      router.push('/visualizadorCalorias')
    }

    const { data, error } = await supabase.auth.getSession()

    if(data.session){
      setSesion(data.session);
      getRegistro();
    } 
    else {
      setSesion(null);
      router.push('/login')
    }
  }

  async function getRegistro() {
    
    const { data, error } = await supabase
    .from('calorias_registro')
    .select('*')
    .eq('id', registroIndex)

    if (error) {
      console.log('ERROR: No se encontró el registro de calorias.')
      console.log(error)
    }
    else{
      setRegistro(data[0]);
      setFormInput({
        nombre: data[0].nombre
      })
      
      getProductosRegistro();
    }
  }

  async function updateRegistro(nombre) {
    //console.log(rutinaIndex)
    let temp;

    if (nombre == ''){
      temp = 'Registro calorico sin nombre'
    }
    else{
      temp = nombre
    }

    const { error } = await supabase
    .from('calorias_registro')
    .update({ nombre: temp})
    .eq('id', registroIndex)

    if (error) {
      console.log('ERROR: No se pudo actualizar el registro.')
      console.log(error)
    }
    else{
      console.log('Registro actualizado')
      //console.log(data[0])
    }
  }

  async function eliminarRegistro() {
    const { error } = await supabase
    .from('calorias_registro')
    .delete()
    .match({id: registro.id, usuario: sesion.user.id})

    if (error) {
      console.log('ERROR: Error al eliminar el registro calorico.')
      console.log(error)
    }
    else{
      console.log('Se eliminó ' + registro.nombre)
      router.push('/visualizadorCalorias')
    }
  }

  async function getProductosRegistro() {
    const { data, error } = await supabase
    .from('calorias_registro_productos')
    .select(`
      id,
      producto_id (
        nombre,
        calorias,
        proteinas,
        grasas,
        tipo
      )
    `)
    .eq('registro', registroIndex)

    if (error) {
      console.log('ERROR: Hubo un error al recuperar los productos.')
      console.log(error)
    }
    else{
      console.log(data);
      setProductosRegistro(data);
    }
  }

  async function agregarProducto(idProducto) {
    const { data, error } = await supabase
      .from('calorias_registro_productos')
      .insert({
        registro: registroIndex, 
        producto_id: idProducto
        })
      .select(`
        id,
        producto_id (
          nombre,
          calorias,
          proteinas,
          grasas,
          tipo
        )
      `)

    setToggleSeleccionar(false);

    if (error) {
      console.log(error)
      console.log("ERROR: Hubo un error al agregar un nuevo producto.")
    }
    else{
      console.log("Se agregó un nuevo producto.")
      console.log(data[0])
      setProductosRegistro(current => [...current, data[0]]);
    }
  }

  const handleOnInputChange = useCallback(
    (event) => {
      const { value, name, id, checked} = event.target;

      setFormInput({
        ...formInput,
        [name]: value,
      });

      updateRegistro(value)

    },
    [formInput, setFormInput]
  );

  return (
    <div className="bg-stone-100 w-full z-0" data-theme="emerald">
      <Head>
        <title>EvoltFit</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />

      <main>
        <br />
        <br />
        <br />
        <br />
        <br />
        
        <div>          
          {
            registro ? 
            <Fragment>
              <div className={"mx-auto mt-2 " + (toggleSeleccionar ? 'blur-sm' : '')}>
                <div className="flex flex-col w-9/12 mx-auto">
                  <div>
                    <button className="btn btn-ghost m-0 px-2 text-lg" onClick={() => {router.push('/visualizadorCalorias')}}>
                      <div className='text-3xl mt-auto'>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                      </div>
                      <span className="ml-2">{"Volver a registros"}</span>
                    </button>
                    <br/>
                    <input name="nombre" id="nombre" type="text" className="input input-secondary input-lg text-2xl text-secondary my-2" value={formInput.nombre || ""} onChange={handleOnInputChange}/>
                    <br/>
                    { productosRegistro.length === 0 ? 
                        <h2>No hay productos en el registro</h2>
                      :
                        (productosRegistro.map((registro) => (
                            <CardProducto
                            key={registro.id}
                            registroProducto={registro} 
                            getProductosRegistro={getProductosRegistro}
                            />
                          ))
                        )
                    }
                    <button onClick={() => setToggleSeleccionar(!toggleSeleccionar)} className="btn text-white btn-secondary mx-1 rounded-lg btn-md w-fit">Agregar producto</button>
                    <button onClick={eliminarRegistro} className="btn text-white mx-1 btn-error rounded-lg btn-md w-fit">Eliminar registro</button>
                  </div>
                </div>
                <div className="flex flex-col items-center w-full">
                  {/* Aqui se muestran las rutinas */}
                </div>
              </div> 
              { 
                toggleSeleccionar ? 
                <SeleccionarProducto
                agregarProducto={agregarProducto}
                setToggleSeleccionar={setToggleSeleccionar}
                /> 
                : '' }
            </Fragment>
            : 
            <div className="mt-12">
              <div className="loader mt-6"></div>
            </div>
          }
        </div>
        <br />
      </main>

      <br />

      <Footer></Footer>
    </div>
  );
}
