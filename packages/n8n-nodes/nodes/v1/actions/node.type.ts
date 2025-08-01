import type { AllEntities } from 'n8n-workflow';

export type PapraType = AllEntities<{
    statistics: 'get',
    document: 'create' | 'list' | 'update' | 'get' | 'get_file' | 'get_activity' | 'remove',
    document_tag: 'create' | 'remove',
    tag: 'create' | 'list' | 'update' | 'remove',
    trash: 'list'
}>;