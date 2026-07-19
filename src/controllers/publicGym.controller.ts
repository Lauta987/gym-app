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
  const frontendUrl = process.env.FRONTEND_URL
    ?.trim()
    .replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL no está configurado");
  }

  return frontendUrl;
}

function addVersionToUrl(
  url: string,
  version: string
): string {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}v=${version}`;
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

    res.status(200).json({
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
    console.error(
      "Error al obtener gimnasio público:",
      error
    );

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
        "name slug logoUrl primaryColor secondaryColor active updatedAt"
      )
      .lean();

    if (!gym) {
      res.status(404).json({
        message: "Gimnasio no encontrado",
      });

      return;
    }

    const frontendUrl = getFrontendUrl();

    const gymStartUrl =
      `${frontendUrl}/gym/${encodeURIComponent(gym.slug)}`;

    /*
     * Usamos updatedAt para cambiar la versión del ícono
     * cuando se actualiza el gimnasio.
     */
    const gymWithTimestamp = gym as typeof gym & {
      updatedAt?: Date;
    };

    const iconVersion =
      gymWithTimestamp.updatedAt instanceof Date
        ? gymWithTimestamp.updatedAt.getTime().toString()
        : Date.now().toString();

    let icons;

    if (gym.logoUrl) {
      const versionedLogoUrl = addVersionToUrl(
        gym.logoUrl,
        iconVersion
      );

      /*
       * Cuando existe un logo personalizado, se utiliza
       * tanto para el ícono de 192 como para el de 512.
       *
       * Así se evita que el teléfono elija el viejo
       * icon-192.png de GymStart.
       */
      icons = [
        {
          src: versionedLogoUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: versionedLogoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ];
    } else {
      /*
       * Los íconos generales se usan solamente cuando
       * el gimnasio no tiene un logo configurado.
       */
      icons = [
        {
          src: addVersionToUrl(
            `${frontendUrl}/icon-192.png`,
            iconVersion
          ),
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: addVersionToUrl(
            `${frontendUrl}/icon-512.png`,
            iconVersion
          ),
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ];
    }

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

      theme_color:
        gym.primaryColor || "#dc2626",

      background_color:
        gym.secondaryColor || "#111111",

      icons,

      prefer_related_applications: false,
    };

    res.setHeader(
      "Content-Type",
      "application/manifest+json; charset=utf-8"
    );

    /*
     * Permite utilizar el manifest desde el frontend
     * aunque backend y frontend tengan dominios diferentes.
     */
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    /*
     * Evita que el navegador siga mostrando el manifiesto
     * anterior durante las pruebas.
     */
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.status(200).send(
      JSON.stringify(manifest)
    );
  } catch (error) {
    console.error(
      "Error al generar manifiesto del gimnasio:",
      error
    );

    res.status(500).json({
      message: "Error interno al generar el manifiesto",
    });
  }
}; 