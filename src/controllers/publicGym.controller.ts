import type { Request, Response } from "express";

import { Gym } from "../models/gym.model";

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL no está configurado");
  }

  return frontendUrl;
}

/*
 * Devuelve la identidad pública de un gimnasio.
 * No expone usuarios, administradores ni información privada.
 */
export const getPublicGymBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const slug = normalizeSlug(req.params.slug || "");

    if (!slug) {
      res.status(400).json({
        message: "Slug de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findOne({
      slug,
      active: true,
    })
      .select(
        "_id name slug logoUrl primaryColor secondaryColor active"
      )
      .lean();

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    res.json({
      message: "Gimnasio obtenido correctamente",
      gym: {
        _id: gym._id,
        name: gym.name,
        slug: gym.slug,
        logoUrl: gym.logoUrl,
        primaryColor: gym.primaryColor,
        secondaryColor: gym.secondaryColor,
      },
    });
  } catch (error) {
    console.error("Error al obtener gimnasio público:", error);

    res.status(500).json({
      message: "Error interno al obtener el gimnasio",
    });
  }
};

/*
 * Genera el manifiesto instalable específico de cada gimnasio.
 */
export const getGymManifest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const slug = normalizeSlug(req.params.slug || "");

    if (!slug) {
      res.status(400).json({
        message: "Slug de gimnasio inválido",
      });
      return;
    }

    const gym = await Gym.findOne({
      slug,
      active: true,
    })
      .select(
        "name slug logoUrl primaryColor secondaryColor active"
      )
      .lean();

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });
      return;
    }

    const frontendUrl = getFrontendUrl();
    const gymStartUrl = `${frontendUrl}/gym/${gym.slug}`;

    /*
     * El ícono personalizado debe ser una imagen pública,
     * cuadrada y preferentemente de 512 x 512 píxeles.
     *
     * Conservamos icon-192.png como respaldo para cumplir
     * con los tamaños habituales del manifiesto.
     */
    const icons = [
      {
        src: `${frontendUrl}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      gym.logoUrl
        ? {
            src: gym.logoUrl,
            sizes: "512x512",
            purpose: "any",
          }
        : {
            src: `${frontendUrl}/icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
    ];

    const manifest = {
      id: gymStartUrl,
      name: gym.name,
      short_name:
        gym.name.length > 20
          ? gym.name.slice(0, 20)
          : gym.name,
      description: `Rutinas y progreso de ${gym.name}`,
      start_url: gymStartUrl,
      scope: `${frontendUrl}/`,
      display: "standalone",
      orientation: "portrait",
      theme_color: gym.primaryColor || "#dc2626",
      background_color: gym.secondaryColor || "#111111",
      icons,
    };

    /*
     * Helmet agrega políticas restrictivas por defecto.
     * Permitimos que el frontend desplegado en otro dominio
     * pueda utilizar este manifiesto.
     */
    res.setHeader(
      "Content-Type",
      "application/manifest+json; charset=utf-8"
    );
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );
    res.setHeader(
      "Cache-Control",
      "public, max-age=300"
    );

    res.status(200).send(JSON.stringify(manifest));
  } catch (error) {
    console.error("Error al generar manifiesto del gimnasio:", error);

    res.status(500).json({
      message: "Error interno al generar el manifiesto",
    });
  }
}; 