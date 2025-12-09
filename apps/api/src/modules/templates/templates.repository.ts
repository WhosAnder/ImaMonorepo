import { ObjectId } from 'mongodb';
import { getTemplateCollection } from '../../db/mongo';
import { Template } from './templates.types';

export async function findTemplates(query: Record<string, unknown>) {
  const collection = await getTemplateCollection();
  return collection.find(query).toArray();
}

export async function findTemplateById(id: ObjectId) {
  const collection = await getTemplateCollection();
  return collection.findOne({ _id: id });
}

export type NewTemplate = Omit<Template, '_id'>;

export async function insertTemplate(template: NewTemplate) {
  const collection = await getTemplateCollection();
  return collection.insertOne(template);
}
