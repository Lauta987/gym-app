import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("No se encontró la variable MONGO_URI en el archivo .env");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado correctamente");
  } catch (error) {
    console.error("Error al conectar MongoDB:", error);
    process.exit(1);
  }
}; 