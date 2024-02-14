// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $accessToken from "./routes/accessToken.tsx";
import * as $addLocalConnection from "./routes/addLocalConnection.tsx";
import * as $addSelfHostedConnection from "./routes/addSelfHostedConnection.tsx";
import * as $api_abort from "./routes/api/abort.tsx";
import * as $api_copyKey from "./routes/api/copyKey.tsx";
import * as $api_copyKeys from "./routes/api/copyKeys.tsx";
import * as $api_deleteKey from "./routes/api/deleteKey.tsx";
import * as $api_deleteKeys from "./routes/api/deleteKeys.tsx";
import * as $api_export_download from "./routes/api/export/download.tsx";
import * as $api_export_initiate from "./routes/api/export/initiate.tsx";
import * as $api_export_status from "./routes/api/export/status.tsx";
import * as $api_import from "./routes/api/import.tsx";
import * as $api_keyTypes from "./routes/api/keyTypes.tsx";
import * as $api_removeConnection from "./routes/api/removeConnection.tsx";
import * as $api_setEntry from "./routes/api/setEntry.tsx";
import * as $api_updateKey from "./routes/api/updateKey.tsx";
import * as $api_valueSize from "./routes/api/valueSize.tsx";
import * as $export from "./routes/export.tsx";
import * as $get from "./routes/get.tsx";
import * as $import from "./routes/import.tsx";
import * as $index from "./routes/index.tsx";
import * as $list from "./routes/list.tsx";
import * as $logout from "./routes/logout.tsx";
import * as $set from "./routes/set.tsx";
import * as $test from "./routes/test.tsx";
import * as $AccessTokenInput from "./islands/AccessTokenInput.tsx";
import * as $DarkMode from "./islands/DarkMode.tsx";
import * as $EntryEditor from "./islands/EntryEditor.tsx";
import * as $Help from "./islands/Help.tsx";
import * as $SelfHostedAccessTokenInput from "./islands/SelfHostedAccessTokenInput.tsx";
import * as $SetEntryEditor from "./islands/SetEntryEditor.tsx";
import * as $TabBar from "./islands/TabBar.tsx";
import * as $TestToast from "./islands/TestToast.tsx";
import * as $Toast from "./islands/Toast.tsx";
import * as $avatarMenu_AvatarMenu from "./islands/avatarMenu/AvatarMenu.tsx";
import * as $avatarMenu_UnknownAvatarMenu from "./islands/avatarMenu/UnknownAvatarMenu.tsx";
import * as $connections_AddConnectionButton from "./islands/connections/AddConnectionButton.tsx";
import * as $connections_CancelLocalConnectionButton from "./islands/connections/CancelLocalConnectionButton.tsx";
import * as $connections_ConnectButton from "./islands/connections/ConnectButton.tsx";
import * as $connections_ConnectionCard from "./islands/connections/ConnectionCard.tsx";
import * as $connections_LocalConnectionRadio from "./islands/connections/LocalConnectionRadio.tsx";
import * as $connections_RemoveLocalConnectionDialog from "./islands/connections/RemoveLocalConnectionDialog.tsx";
import * as $export_export from "./islands/export/export.tsx";
import * as $get_GetCriteriaBox from "./islands/get/GetCriteriaBox.tsx";
import * as $get_GetResult from "./islands/get/GetResult.tsx";
import * as $import_importCriteria from "./islands/import/importCriteria.tsx";
import * as $keyValue_KvKeyEditor from "./islands/keyValue/KvKeyEditor.tsx";
import * as $keyValue_KvKeyInput from "./islands/keyValue/KvKeyInput.tsx";
import * as $keyValue_KvValueEditor from "./islands/keyValue/KvValueEditor.tsx";
import * as $list_ListCriteriaBox from "./islands/list/ListCriteriaBox.tsx";
import * as $list_ListResults from "./islands/list/ListResults.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/accessToken.tsx": $accessToken,
    "./routes/addLocalConnection.tsx": $addLocalConnection,
    "./routes/addSelfHostedConnection.tsx": $addSelfHostedConnection,
    "./routes/api/abort.tsx": $api_abort,
    "./routes/api/copyKey.tsx": $api_copyKey,
    "./routes/api/copyKeys.tsx": $api_copyKeys,
    "./routes/api/deleteKey.tsx": $api_deleteKey,
    "./routes/api/deleteKeys.tsx": $api_deleteKeys,
    "./routes/api/export/download.tsx": $api_export_download,
    "./routes/api/export/initiate.tsx": $api_export_initiate,
    "./routes/api/export/status.tsx": $api_export_status,
    "./routes/api/import.tsx": $api_import,
    "./routes/api/keyTypes.tsx": $api_keyTypes,
    "./routes/api/removeConnection.tsx": $api_removeConnection,
    "./routes/api/setEntry.tsx": $api_setEntry,
    "./routes/api/updateKey.tsx": $api_updateKey,
    "./routes/api/valueSize.tsx": $api_valueSize,
    "./routes/export.tsx": $export,
    "./routes/get.tsx": $get,
    "./routes/import.tsx": $import,
    "./routes/index.tsx": $index,
    "./routes/list.tsx": $list,
    "./routes/logout.tsx": $logout,
    "./routes/set.tsx": $set,
    "./routes/test.tsx": $test,
  },
  islands: {
    "./islands/AccessTokenInput.tsx": $AccessTokenInput,
    "./islands/DarkMode.tsx": $DarkMode,
    "./islands/EntryEditor.tsx": $EntryEditor,
    "./islands/Help.tsx": $Help,
    "./islands/SelfHostedAccessTokenInput.tsx": $SelfHostedAccessTokenInput,
    "./islands/SetEntryEditor.tsx": $SetEntryEditor,
    "./islands/TabBar.tsx": $TabBar,
    "./islands/TestToast.tsx": $TestToast,
    "./islands/Toast.tsx": $Toast,
    "./islands/avatarMenu/AvatarMenu.tsx": $avatarMenu_AvatarMenu,
    "./islands/avatarMenu/UnknownAvatarMenu.tsx": $avatarMenu_UnknownAvatarMenu,
    "./islands/connections/AddConnectionButton.tsx": $connections_AddConnectionButton,
    "./islands/connections/CancelLocalConnectionButton.tsx":
      $connections_CancelLocalConnectionButton,
    "./islands/connections/ConnectButton.tsx": $connections_ConnectButton,
    "./islands/connections/ConnectionCard.tsx": $connections_ConnectionCard,
    "./islands/connections/LocalConnectionRadio.tsx": $connections_LocalConnectionRadio,
    "./islands/connections/RemoveLocalConnectionDialog.tsx":
      $connections_RemoveLocalConnectionDialog,
    "./islands/export/export.tsx": $export_export,
    "./islands/get/GetCriteriaBox.tsx": $get_GetCriteriaBox,
    "./islands/get/GetResult.tsx": $get_GetResult,
    "./islands/import/importCriteria.tsx": $import_importCriteria,
    "./islands/keyValue/KvKeyEditor.tsx": $keyValue_KvKeyEditor,
    "./islands/keyValue/KvKeyInput.tsx": $keyValue_KvKeyInput,
    "./islands/keyValue/KvValueEditor.tsx": $keyValue_KvValueEditor,
    "./islands/list/ListCriteriaBox.tsx": $list_ListCriteriaBox,
    "./islands/list/ListResults.tsx": $list_ListResults,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
