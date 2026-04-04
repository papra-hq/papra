import { Router } from 'express';
import { z } from 'zod';
import mime from 'mime-types';
import { requireAuth } from '../../middlewares/require-auth';
import { validateRequest } from '../../middlewares/validate-request';
import { getDocument } from '../../lib/documents';
import { getFile } from '../../lib/storage';

const router = Router();

router.get(
  '/:documentId/download',
  requireAuth(),
  validateRequest({
    params: z.object({
      documentId: z.string(),
    }),
  }),
  async (req, res) => {
    const { documentId } = req.params;
    const { user } = req;

    const document = await getDocument(documentId, user.id);

    if (!document) {
      return res.status(404).send({ error: 'Document not found' });
    }

    const file = await getFile(document.storagePath);

    if (!file) {
      return res.status(404).send({ error: 'File not found' });
    }

    const extension = mime.extension(document.mimeType);
    let filename = document.name;

    if (extension && !filename.toLowerCase().endsWith(`.${extension}`)) {
      filename = `${filename}.${extension}`;
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader('Content-Length', file.metadata.size);

    file.stream.pipe(res);
  }
);

export { router as downloadDocumentRouter };
