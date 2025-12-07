import axios from "axios";

const STRAPI_URL = "http://localhost:1337/api/productos";

// GET ALL PRODUCTS

export const getAllProducts = async (req, res) => {
  try {
    const response = await axios.get(STRAPI_URL + "?populate=*");
    const productosRaw = response.data.data;

    const productos = productosRaw.map((item) => {
      let imagen = null;
      if (Array.isArray(item.imagen) && item.imagen.length > 0) {
        imagen = "http://localhost:1337" + item.imagen[0].url;
      }

      return {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        descripcion: item.descripcion,
        material: item.material,
        esnew: item.esnew,
        tipocombo: item.tipocombo,
        matecolor: item.matecolor,
        esta_activo: item.esta_activo,
        stock: item.stock,
        permite_grabado: item.congrabado,
        imagen, 
      };
    });

    const productosActivos = productos.filter((p) => p.esta_activo === true);

    res.json(productosActivos);

  } catch (error) {
    console.error("Error obteniendo productos desde Strapi:", error.message);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
};

// GET PRODUCT BY ID

export const getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    const response = await axios.get(
      `${STRAPI_URL}?filters[id][$eq]=${id}&populate[0]=imagen&populate[1]=variantes_relacionadas`
    );

    const items = response.data.data;

    if (!items || items.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const item = items[0];

    if (!item.esta_activo)
      return res.status(404).json({ error: "Producto no disponible" });

    let imagen = null;
    if (Array.isArray(item.imagen) && item.imagen.length > 0) {
      imagen = "http://localhost:1337" + item.imagen[0].url;
    }

    const producto = {
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      descripcion: item.descripcion,
      material: item.material,
      esnew: item.esnew,
      tipocombo: item.tipocombo,
      matecolor: item.matecolor,
      esta_activo: item.esta_activo,
      stock: item.stock,
      permite_grabado: item.congrabado,
      imagen,
      relacionados: item.variantes_relacionadas || [], 
    };

    res.json(producto);

  } catch (error) {
    console.error("🔥 Error obteniendo producto:", error.response?.data || error);
    res.status(500).json({ error: "Error obteniendo producto" });
  }
};
