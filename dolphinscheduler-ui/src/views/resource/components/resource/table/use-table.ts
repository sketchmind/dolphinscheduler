/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { h, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Router } from 'vue-router'
import { useRouter } from 'vue-router'
import { bytesToSize } from '@/common/common'
import TableAction from './table-action'
import { IRenameResource, IReuploadResource, ResourceType } from '../types'
import ButtonLink from '@/components/button-link'
import { NEllipsis } from 'naive-ui'
import { calculateTableWidth, COLUMN_WIDTH_CONFIG, DefaultTableWidth } from '@/common/column-width-config'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { useFileState } from "@/views/resource/components/resource/use-file";


const goSubFolder = (router: Router, item: any) => {
  if (item.directory) {
    router.push({
      name: item.type === 'UDF' ? 'resource-sub-manage' : 'resource-file-subdirectory',
      params: { id: item.id }
    })
  } else if (item.type === 'FILE') {
    router.push({ name: 'resource-file-list', params: { id: item.id } })
  }
}


export function useTable() {
  const { t } = useI18n()
  const router: Router = useRouter()

  const variables = reactive({
    fileId: ref(Number(router.currentRoute.value.params.id) || -1),
    resourceType: ref<ResourceType>(),
    resourceList: ref(),
    folderShowRef: ref(false),
    uploadShowRef: ref(false),
    isReupload: ref(false),
    renameShowRef: ref(false),
    searchRef: ref(),
    renameInfo: ref({
      id: -1,
      name: '',
      description: ''
    }),
    reuploadInfo: ref({
      id: -1,
      name: '',
      description: ''
    }),
    pagination: ref({
      page: 1,
      pageSize: 10,
      itemCount: 0,
      pageSizes: [10, 30, 50]

    })
  })

  const columnsRef: TableColumns<any> = [
    {
      title: '#',
      key: 'id',
      ...COLUMN_WIDTH_CONFIG['index'],
      render: (_row, index) => index + 1
    },
    {
      title: t('resource.file.name'),
      key: 'name',
      ...COLUMN_WIDTH_CONFIG['linkName'],
      render: (row) => {
        return !row.directory
          ? row.alias
          : h(
            ButtonLink,
            {
              onClick: () => goSubFolder(router, row)
            },
            {
              default: () =>
                h(
                  NEllipsis,
                  COLUMN_WIDTH_CONFIG['linkEllipsis'],
                  () => row.alias
                )
            }
          )
      }
    },
    {
      title: t('resource.file.user_name'),
      ...COLUMN_WIDTH_CONFIG['userName'],
      key: 'user_name'
    },
    {
      title: t('resource.file.whether_directory'),
      key: 'whether_directory',
      ...COLUMN_WIDTH_CONFIG['yesOrNo'],
      render: (row) =>
        row.directory ? t('resource.file.yes') : t('resource.file.no')
    },
    {
      title: t('resource.file.file_name'),
      ...COLUMN_WIDTH_CONFIG['name'],
      key: 'file_name'
    },
    {
      title: t('resource.file.description'),
      ...COLUMN_WIDTH_CONFIG['note'],
      key: 'description'
    },
    {
      title: t('resource.file.size'),
      key: 'size',
      ...COLUMN_WIDTH_CONFIG['size'],
      render: (row) => bytesToSize(row.size)
    },
    {
      title: t('resource.file.create_time'),
      ...COLUMN_WIDTH_CONFIG['time'],
      key: 'create_time'
    },
    {
      title: t('resource.file.update_time'),
      ...COLUMN_WIDTH_CONFIG['time'],
      key: 'update_time'
    },
    {
      title: t('resource.file.operation'),
      key: 'operation',
      render: (row) =>
        h(TableAction, {
          row,
          onReuploadResource: (id, name, description) =>
            reuploadResource(id, name, description),
          onRenameResource: (id, name, description) =>
            renameResource(id, name, description),
          onUpdateList: () => updateList()
        }),
      ...COLUMN_WIDTH_CONFIG['operation'](variables.resourceType === 'UDF' ? 4 : 5)
    }
  ]

  const createFile = () => {
    const { fileId } = variables
    const name = fileId
      ? 'resource-subfile-create'
      : 'resource-file-create'
    router.push({
      name,
      params: { id: fileId }
    })
  }

  const reuploadResource: IReuploadResource = (id, name, description) => {
    variables.reuploadInfo = {
      id: id,
      name: name,
      description: description
    }
    variables.isReupload = true
    variables.uploadShowRef = true
  }

  const renameResource: IRenameResource = (id, name, description) => {
    variables.renameInfo = {
      id: id,
      name: name,
      description: description
    }
    variables.renameShowRef = true
  }

  const setPagination = (count: number) => {
    variables.pagination.itemCount = count
  }

  const { getResourceListState } = useFileState(setPagination)

  const requestData = () => {
    variables.resourceList = getResourceListState(
      variables.resourceType!,
      variables.fileId,
      variables.searchRef,
      variables.pagination.page,
      variables.pagination.pageSize
    )
  }


  const updateList = () => {
    variables.pagination.page = 1
    requestData()
  }

  return {
    variables,
    columnsRef,
    tableWidth: calculateTableWidth(columnsRef) || DefaultTableWidth,
    requestData,
    updateList,
    handleCreateFile: createFile,
  }
}
