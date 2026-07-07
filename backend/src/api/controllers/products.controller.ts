import type { Request, Response } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../../services/products/products.service';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from '../validators/products.validators';

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(req.user!.id, input);
  res.status(201).json({ product });
}

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await listProducts(req.user!.id, query);
  res.status(200).json(result);
}

export async function getProductHandler(req: Request, res: Response): Promise<void> {
  const id = productIdParamSchema.parse(req.params.id);
  const product = await getProductById(id, req.user!.id);
  res.status(200).json({ product });
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  const id = productIdParamSchema.parse(req.params.id);
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(id, req.user!.id, input);
  res.status(200).json({ product });
}

export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  const id = productIdParamSchema.parse(req.params.id);
  await deleteProduct(id, req.user!.id);
  res.status(204).send();
}
