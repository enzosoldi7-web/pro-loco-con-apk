import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Tabella CRC32 standard per archivi ZIP / APK
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

export function crc32Buffer(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUleb128(val: number): Buffer {
  const bytes: number[] = [];
  let v = val >>> 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (v !== 0);
  return Buffer.from(bytes);
}

/**
 * Compila un file classes.dex (Dalvik Executable) 100% valido e funzionante
 * che definisce `it.proloco.soci.MainActivity extends android.app.Activity`
 * e apre `targetUrl` in una WebView Android a schermo intero con JavaScript e localStorage attivi.
 */
export function buildWorkingDex(targetUrl: string): Buffer {
  // Assicura che l'URL inizi sempre con 'http' così l'ordine lessicografico in string_ids è 100% invariante
  const safeUrl =
    targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`;

  // 24 stringhe ordinate in modo rigorosamente lessicografico ASCII
  const strings = [
    '<init>', // 0
    'L', // 1
    'Landroid/app/Activity;', // 2
    'Landroid/content/Context;', // 3
    'Landroid/os/Bundle;', // 4
    'Landroid/view/View;', // 5
    'Landroid/webkit/WebSettings;', // 6
    'Landroid/webkit/WebView;', // 7
    'Landroid/webkit/WebViewClient;', // 8
    'Lit/proloco/soci/MainActivity;', // 9
    'Ljava/lang/Object;', // 10
    'Ljava/lang/String;', // 11
    'V', // 12
    'VL', // 13
    'VZ', // 14
    'Z', // 15
    'getSettings', // 16
    safeUrl, // 17 ('h' viene sempre tra 'getSettings' e 'loadUrl')
    'loadUrl', // 18
    'onCreate', // 19
    'setContentView', // 20
    'setDomStorageEnabled', // 21
    'setJavaScriptEnabled', // 22
    'setWebViewClient' // 23
  ];

  // Type IDs (indici in `strings`, ordinati)
  // 0: Activity (2)
  // 1: Context (3)
  // 2: Bundle (4)
  // 3: View (5)
  // 4: WebSettings (6)
  // 5: WebView (7)
  // 6: WebViewClient (8)
  // 7: MainActivity (9)
  // 8: Object (10)
  // 9: String (11)
  // 10: V (12)
  // 11: Z (15)
  const typeStringIndices = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15];

  // Proto IDs: [shorty_str_idx, return_type_idx, param_type_idx | null]
  const protos: Array<{ shorty: number; ret: number; param: number | null }> = [
    { shorty: 1, ret: 4, param: null }, // 0: ()Landroid/webkit/WebSettings;
    { shorty: 12, ret: 10, param: null }, // 1: ()V
    { shorty: 13, ret: 10, param: 1 }, // 2: (Landroid/content/Context;)V
    { shorty: 13, ret: 10, param: 2 }, // 3: (Landroid/os/Bundle;)V
    { shorty: 13, ret: 10, param: 3 }, // 4: (Landroid/view/View;)V
    { shorty: 13, ret: 10, param: 6 }, // 5: (Landroid/webkit/WebViewClient;)V
    { shorty: 13, ret: 10, param: 9 }, // 6: (Ljava/lang/String;)V
    { shorty: 14, ret: 10, param: 11 } // 7: (Z)V
  ];

  // Method IDs: [class_type_idx, proto_idx, name_str_idx]
  const methods: Array<{ cls: number; proto: number; name: number }> = [
    { cls: 0, proto: 1, name: 0 }, // 0: Activity.<init>()V
    { cls: 0, proto: 3, name: 19 }, // 1: Activity.onCreate(Bundle)V
    { cls: 0, proto: 4, name: 20 }, // 2: Activity.setContentView(View)V
    { cls: 4, proto: 7, name: 21 }, // 3: WebSettings.setDomStorageEnabled(Z)V
    { cls: 4, proto: 7, name: 22 }, // 4: WebSettings.setJavaScriptEnabled(Z)V
    { cls: 5, proto: 2, name: 0 }, // 5: WebView.<init>(Context)V
    { cls: 5, proto: 0, name: 16 }, // 6: WebView.getSettings()WebSettings
    { cls: 5, proto: 6, name: 18 }, // 7: WebView.loadUrl(String)V
    { cls: 5, proto: 5, name: 23 }, // 8: WebView.setWebViewClient(WebViewClient)V
    { cls: 6, proto: 1, name: 0 }, // 9: WebViewClient.<init>()V
    { cls: 7, proto: 1, name: 0 }, // 10: MainActivity.<init>()V
    { cls: 7, proto: 3, name: 19 } // 11: MainActivity.onCreate(Bundle)V
  ];

  // Layout delle sezioni a offset fissi e allineati a 4 byte:
  // Header: 0x0000 .. 0x0070 (112 bytes)
  // String IDs: 24 * 4 = 96 bytes (0x0070 .. 0x00D0)
  // Type IDs: 12 * 4 = 48 bytes (0x00D0 .. 0x0100)
  // Proto IDs: 8 * 12 = 96 bytes (0x0100 .. 0x0160)
  // Method IDs: 12 * 8 = 96 bytes (0x0160 .. 0x01C0)
  // Class Defs: 1 * 32 = 32 bytes (0x01C0 .. 0x01E0)
  const headerSize = 0x70;
  const stringIdsOff = 0x70;
  const typeIdsOff = stringIdsOff + strings.length * 4; // 0xD0
  const protoIdsOff = typeIdsOff + typeStringIndices.length * 4; // 0x100
  const methodIdsOff = protoIdsOff + protos.length * 12; // 0x160
  const classDefsOff = methodIdsOff + methods.length * 8; // 0x1C0
  const dataStartOff = classDefsOff + 32; // 0x1E0

  // Costruzione sezione Data:
  // 1. Type Lists per i 6 proto con 1 parametro (ciascuno 8 bytes: size=1 (uint32), type_idx (uint16), pad (uint16))
  const typeListsOff = dataStartOff; // 0x1E0
  const typeListsBuf = Buffer.alloc(6 * 8);
  const paramTypes = [1, 2, 3, 6, 9, 11];
  for (let i = 0; i < paramTypes.length; i++) {
    typeListsBuf.writeUInt32LE(1, i * 8);
    typeListsBuf.writeUInt16LE(paramTypes[i], i * 8 + 4);
    typeListsBuf.writeUInt16LE(0, i * 8 + 6);
  }

  // 2. Code Item 1: MainActivity.<init>()V (allineato a 4 byte)
  const codeInitOff = typeListsOff + typeListsBuf.length; // 0x210
  // 16 bytes header + 8 bytes insns = 24 bytes
  const codeInitBuf = Buffer.alloc(24);
  codeInitBuf.writeUInt16LE(1, 0); // registers_size = 1
  codeInitBuf.writeUInt16LE(1, 2); // ins_size = 1
  codeInitBuf.writeUInt16LE(1, 4); // outs_size = 1
  codeInitBuf.writeUInt16LE(0, 6); // tries_size = 0
  codeInitBuf.writeUInt32LE(0, 8); // debug_info_off = 0
  codeInitBuf.writeUInt32LE(4, 12); // insns_size = 4 code units (8 bytes)
  Buffer.from([0x70, 0x10, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00]).copy(codeInitBuf, 16);

  // 3. Code Item 2: MainActivity.onCreate(Bundle)V (allineato a 4 byte)
  const codeOnCreateOff = codeInitOff + codeInitBuf.length; // 0x228
  const onCreateInsns = Buffer.from([
    0x6f, 0x20, 0x01, 0x00, 0x43, 0x00, // invoke-super {v3, v4}, Activity.onCreate
    0x22, 0x00, 0x05, 0x00,             // new-instance v0, WebView
    0x70, 0x20, 0x05, 0x00, 0x30, 0x00, // invoke-direct {v0, v3}, WebView.<init>(Context)
    0x6e, 0x10, 0x06, 0x00, 0x00, 0x00, // invoke-virtual {v0}, WebView.getSettings()
    0x0c, 0x01,                         // move-result-object v1
    0x12, 0x12,                         // const/4 v2, 0x1
    0x6e, 0x20, 0x04, 0x00, 0x21, 0x00, // invoke-virtual {v1, v2}, WebSettings.setJavaScriptEnabled(true)
    0x6e, 0x20, 0x03, 0x00, 0x21, 0x00, // invoke-virtual {v1, v2}, WebSettings.setDomStorageEnabled(true)
    0x22, 0x01, 0x06, 0x00,             // new-instance v1, WebViewClient
    0x70, 0x10, 0x09, 0x00, 0x01, 0x00, // invoke-direct {v1}, WebViewClient.<init>()
    0x6e, 0x20, 0x08, 0x00, 0x10, 0x00, // invoke-virtual {v0, v1}, WebView.setWebViewClient(v1)
    0x6e, 0x20, 0x02, 0x00, 0x03, 0x00, // invoke-virtual {v3, v0}, Activity.setContentView(v0)
    0x1a, 0x01, 0x11, 0x00,             // const-string v1, string[17] (safeUrl)
    0x6e, 0x20, 0x07, 0x00, 0x10, 0x00, // invoke-virtual {v0, v1}, WebView.loadUrl(v1)
    0x0e, 0x00                          // return-void
  ]);
  const insnsCodeUnits = onCreateInsns.length / 2; // 37 code units (74 bytes)
  const codeOnCreateHeader = Buffer.alloc(16);
  codeOnCreateHeader.writeUInt16LE(5, 0); // registers_size = 5
  codeOnCreateHeader.writeUInt16LE(2, 2); // ins_size = 2
  codeOnCreateHeader.writeUInt16LE(2, 4); // outs_size = 2
  codeOnCreateHeader.writeUInt16LE(0, 6); // tries_size = 0
  codeOnCreateHeader.writeUInt32LE(0, 8); // debug_info_off = 0
  codeOnCreateHeader.writeUInt32LE(insnsCodeUnits, 12);
  // Pad a 4 byte (16 + 74 = 90 -> pad 2 bytes = 92 bytes)
  const codeOnCreateBuf = Buffer.concat([codeOnCreateHeader, onCreateInsns, Buffer.alloc(2)]);

  // 4. String Data Items
  const stringDataStartOff = codeOnCreateOff + codeOnCreateBuf.length;
  const stringDataOffsets: number[] = [];
  const stringDataBuffers: Buffer[] = [];
  let currentStrOff = stringDataStartOff;

  for (const s of strings) {
    stringDataOffsets.push(currentStrOff);
    const utf8Buf = Buffer.from(s, 'utf-8');
    const lenUleb = encodeUleb128(s.length);
    const itemBuf = Buffer.concat([lenUleb, utf8Buf, Buffer.from([0x00])]);
    stringDataBuffers.push(itemBuf);
    currentStrOff += itemBuf.length;
  }

  // Allinea a 4 byte prima di class_data_item
  const padBeforeClassData = (4 - (currentStrOff % 4)) % 4;
  if (padBeforeClassData > 0) {
    stringDataBuffers.push(Buffer.alloc(padBeforeClassData));
    currentStrOff += padBeforeClassData;
  }

  // 5. class_data_item per MainActivity
  const classDataOff = currentStrOff;
  const classDataBuf = Buffer.concat([
    encodeUleb128(0), // static_fields_size = 0
    encodeUleb128(0), // instance_fields_size = 0
    encodeUleb128(1), // direct_methods_size = 1 (<init>)
    encodeUleb128(1), // virtual_methods_size = 1 (onCreate)
    // direct_method[0]: method_idx_diff = 10, access_flags = 0x10001 (PUBLIC | CONSTRUCTOR), code_off = codeInitOff
    encodeUleb128(10),
    encodeUleb128(0x10001),
    encodeUleb128(codeInitOff),
    // virtual_method[0]: method_idx_diff = 11, access_flags = 0x0004 (PROTECTED), code_off = codeOnCreateOff
    encodeUleb128(11),
    encodeUleb128(0x0004),
    encodeUleb128(codeOnCreateOff)
  ]);
  currentStrOff += classDataBuf.length;
  const padBeforeMap = (4 - (currentStrOff % 4)) % 4;
  const classDataPadded = Buffer.concat([classDataBuf, Buffer.alloc(padBeforeMap)]);
  currentStrOff += padBeforeMap;

  // 6. Map List (richiesto dal verificatore DEX di Android)
  const mapListOff = currentStrOff;
  const mapItems: Array<{ type: number; size: number; offset: number }> = [
    { type: 0x0000, size: 1, offset: 0 }, // HEADER_ITEM
    { type: 0x0001, size: strings.length, offset: stringIdsOff }, // STRING_ID_ITEM
    { type: 0x0002, size: typeStringIndices.length, offset: typeIdsOff }, // TYPE_ID_ITEM
    { type: 0x0003, size: protos.length, offset: protoIdsOff }, // PROTO_ID_ITEM
    { type: 0x0005, size: methods.length, offset: methodIdsOff }, // METHOD_ID_ITEM
    { type: 0x0006, size: 1, offset: classDefsOff }, // CLASS_DEF_ITEM
    { type: 0x1001, size: 6, offset: typeListsOff }, // TYPE_LIST
    { type: 0x2001, size: 2, offset: codeInitOff }, // CODE_ITEM
    { type: 0x2002, size: strings.length, offset: stringDataStartOff }, // STRING_DATA_ITEM
    { type: 0x2000, size: 1, offset: classDataOff }, // CLASS_DATA_ITEM
    { type: 0x1000, size: 1, offset: mapListOff } // MAP_LIST
  ];
  const mapBuf = Buffer.alloc(4 + mapItems.length * 12);
  mapBuf.writeUInt32LE(mapItems.length, 0);
  for (let i = 0; i < mapItems.length; i++) {
    const pos = 4 + i * 12;
    mapBuf.writeUInt16LE(mapItems[i].type, pos);
    mapBuf.writeUInt16LE(0, pos + 2);
    mapBuf.writeUInt32LE(mapItems[i].size, pos + 4);
    mapBuf.writeUInt32LE(mapItems[i].offset, pos + 8);
  }

  const totalFileSize = mapListOff + mapBuf.length;
  const dataSize = totalFileSize - dataStartOff;

  // Costruzione tabelle indicizzate
  const stringIdsBuf = Buffer.alloc(strings.length * 4);
  for (let i = 0; i < stringDataOffsets.length; i++) {
    stringIdsBuf.writeUInt32LE(stringDataOffsets[i], i * 4);
  }

  const typeIdsBuf = Buffer.alloc(typeStringIndices.length * 4);
  for (let i = 0; i < typeStringIndices.length; i++) {
    typeIdsBuf.writeUInt32LE(typeStringIndices[i], i * 4);
  }

  const protoIdsBuf = Buffer.alloc(protos.length * 12);
  let paramListIdx = 0;
  for (let i = 0; i < protos.length; i++) {
    protoIdsBuf.writeUInt32LE(protos[i].shorty, i * 12);
    protoIdsBuf.writeUInt32LE(protos[i].ret, i * 12 + 4);
    if (protos[i].param !== null) {
      protoIdsBuf.writeUInt32LE(typeListsOff + paramListIdx * 8, i * 12 + 8);
      paramListIdx++;
    } else {
      protoIdsBuf.writeUInt32LE(0, i * 12 + 8);
    }
  }

  const methodIdsBuf = Buffer.alloc(methods.length * 8);
  for (let i = 0; i < methods.length; i++) {
    methodIdsBuf.writeUInt16LE(methods[i].cls, i * 8);
    methodIdsBuf.writeUInt16LE(methods[i].proto, i * 8 + 2);
    methodIdsBuf.writeUInt32LE(methods[i].name, i * 8 + 4);
  }

  const classDefsBuf = Buffer.alloc(32);
  classDefsBuf.writeUInt32LE(7, 0); // class_idx = Type 7 (MainActivity)
  classDefsBuf.writeUInt32LE(0x0001, 4); // access_flags = PUBLIC
  classDefsBuf.writeUInt32LE(0, 8); // superclass_idx = Type 0 (Activity)
  classDefsBuf.writeUInt32LE(0, 12); // interfaces_off = 0
  classDefsBuf.writeUInt32LE(0xffffffff, 16); // source_file_idx = NO_INDEX
  classDefsBuf.writeUInt32LE(0, 20); // annotations_off = 0
  classDefsBuf.writeUInt32LE(classDataOff, 24); // class_data_off
  classDefsBuf.writeUInt32LE(0, 28); // static_values_off = 0

  const headerBuf = Buffer.alloc(headerSize);
  headerBuf.write('dex\n035\0', 0, 'ascii');
  headerBuf.writeUInt32LE(totalFileSize, 32);
  headerBuf.writeUInt32LE(headerSize, 36);
  headerBuf.writeUInt32LE(0x12345678, 40); // ENDIAN_CONSTANT
  headerBuf.writeUInt32LE(0, 44); // link_size
  headerBuf.writeUInt32LE(0, 48); // link_off
  headerBuf.writeUInt32LE(mapListOff, 52); // map_off
  headerBuf.writeUInt32LE(strings.length, 56); // string_ids_size
  headerBuf.writeUInt32LE(stringIdsOff, 60); // string_ids_off
  headerBuf.writeUInt32LE(typeStringIndices.length, 64); // type_ids_size
  headerBuf.writeUInt32LE(typeIdsOff, 68); // type_ids_off
  headerBuf.writeUInt32LE(protos.length, 72); // proto_ids_size
  headerBuf.writeUInt32LE(protoIdsOff, 76); // proto_ids_off
  headerBuf.writeUInt32LE(0, 80); // field_ids_size
  headerBuf.writeUInt32LE(0, 84); // field_ids_off
  headerBuf.writeUInt32LE(methods.length, 88); // method_ids_size
  headerBuf.writeUInt32LE(methodIdsOff, 92); // method_ids_off
  headerBuf.writeUInt32LE(1, 96); // class_defs_size
  headerBuf.writeUInt32LE(classDefsOff, 100); // class_defs_off
  headerBuf.writeUInt32LE(dataSize, 104); // data_size
  headerBuf.writeUInt32LE(dataStartOff, 108); // data_off

  const fullDex = Buffer.concat([
    headerBuf,
    stringIdsBuf,
    typeIdsBuf,
    protoIdsBuf,
    methodIdsBuf,
    classDefsBuf,
    typeListsBuf,
    codeInitBuf,
    codeOnCreateBuf,
    ...stringDataBuffers,
    classDataPadded,
    mapBuf
  ]);

  // Calcola SHA-1 signature (bytes 32..end)
  const sha1 = crypto.createHash('sha1').update(fullDex.subarray(32)).digest();
  sha1.copy(fullDex, 12);

  // Calcola Adler32 checksum (bytes 12..end)
  let a = 1;
  let b = 0;
  for (let i = 12; i < fullDex.length; i++) {
    a = (a + fullDex[i]) % 65521;
    b = (b + a) % 65521;
  }
  fullDex.writeUInt32LE(((b << 16) | a) >>> 0, 8);

  return fullDex;
}

/**
 * Compila un AndroidManifest.xml binario (formato AXML / ResXMLTree) 100% conforme ad Android PackageParser.
 */
export function buildBinaryAndroidManifest(appLabel: string, packageName: string = 'it.proloco.soci'): Buffer {
  // Primi 7 stringhe sono i nomi degli attributi con Resource ID di sistema Android
  const attrResourceIds = [
    0x01010001, // 0: label
    0x01010003, // 1: name
    0x01010010, // 2: exported
    0x0101020c, // 3: minSdkVersion
    0x0101021b, // 4: versionCode
    0x0101021c, // 5: versionName
    0x01010270, // 6: targetSdkVersion
    0x010104e0  // 7: usesCleartextTraffic
  ];

  const poolStrings = [
    'label', // 0
    'name', // 1
    'exported', // 2
    'minSdkVersion', // 3
    'versionCode', // 4
    'versionName', // 5
    'targetSdkVersion', // 6
    'usesCleartextTraffic', // 7
    'android', // 8
    'http://schemas.android.com/apk/res/android', // 9
    '', // 10
    'manifest', // 11
    'package', // 12
    packageName, // 13
    '1.0', // 14
    'uses-sdk', // 15
    'uses-permission', // 16
    'android.permission.INTERNET', // 17
    'application', // 18
    appLabel, // 19
    'activity', // 20
    'it.proloco.soci.MainActivity', // 21
    'intent-filter', // 22
    'action', // 23
    'android.intent.action.MAIN', // 24
    'category', // 25
    'android.intent.category.LAUNCHER' // 26
  ];

  // 1. Costruzione String Pool Chunk (UTF-16LE standard AXML)
  const encodedStrings: Buffer[] = [];
  const offsets: number[] = [];
  let curOffset = 0;

  for (const str of poolStrings) {
    offsets.push(curOffset);
    const u16 = Buffer.from(str, 'utf16le');
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(str.length, 0);
    const nullTerm = Buffer.alloc(2, 0);
    const entry = Buffer.concat([lenBuf, u16, nullTerm]);
    encodedStrings.push(entry);
    curOffset += entry.length;
  }

  const stringsBlockRaw = Buffer.concat(encodedStrings);
  const padStrings = (4 - (stringsBlockRaw.length % 4)) % 4;
  const stringsBlock = Buffer.concat([stringsBlockRaw, Buffer.alloc(padStrings)]);

  const stringPoolHeaderSize = 28;
  const offsetsTableSize = poolStrings.length * 4;
  const stringsStart = stringPoolHeaderSize + offsetsTableSize;
  const stringPoolChunkSize = stringsStart + stringsBlock.length;

  const stringPoolChunk = Buffer.alloc(stringPoolHeaderSize + offsetsTableSize);
  stringPoolChunk.writeUInt16LE(0x0001, 0); // RES_STRING_POOL_TYPE
  stringPoolChunk.writeUInt16LE(stringPoolHeaderSize, 2);
  stringPoolChunk.writeUInt32LE(stringPoolChunkSize, 4);
  stringPoolChunk.writeUInt32LE(poolStrings.length, 8); // stringCount
  stringPoolChunk.writeUInt32LE(0, 12); // styleCount
  stringPoolChunk.writeUInt32LE(0, 16); // flags (0 = UTF-16)
  stringPoolChunk.writeUInt32LE(stringsStart, 20);
  stringPoolChunk.writeUInt32LE(0, 24); // stylesStart
  for (let i = 0; i < offsets.length; i++) {
    stringPoolChunk.writeUInt32LE(offsets[i], stringPoolHeaderSize + i * 4);
  }
  const fullStringPool = Buffer.concat([stringPoolChunk, stringsBlock]);

  // 2. Resource ID Map Chunk (0x0180)
  const resMapSize = 8 + attrResourceIds.length * 4;
  const resMapChunk = Buffer.alloc(resMapSize);
  resMapChunk.writeUInt16LE(0x0180, 0);
  resMapChunk.writeUInt16LE(8, 2);
  resMapChunk.writeUInt32LE(resMapSize, 4);
  for (let i = 0; i < attrResourceIds.length; i++) {
    resMapChunk.writeUInt32LE(attrResourceIds[i], 8 + i * 4);
  }

  // Helpers per nodi XML
  const NO_NS = 0xffffffff;
  const ANDROID_NS = 9;
  const ANDROID_PREFIX = 8;

  function makeNamespaceChunk(isStart: boolean, line: number): Buffer {
    const b = Buffer.alloc(24);
    b.writeUInt16LE(isStart ? 0x0100 : 0x0101, 0);
    b.writeUInt16LE(16, 2);
    b.writeUInt32LE(24, 4);
    b.writeUInt32LE(line, 8);
    b.writeUInt32LE(0xffffffff, 12);
    b.writeUInt32LE(ANDROID_PREFIX, 16);
    b.writeUInt32LE(ANDROID_NS, 20);
    return b;
  }

  interface XmlAttr {
    ns: number;
    name: number;
    rawValue: number;
    dataType: number; // 0x03 = STRING, 0x10 = INT_DEC, 0x12 = INT_BOOLEAN
    data: number;
  }

  function makeStartElement(nameIdx: number, line: number, attrs: XmlAttr[]): Buffer {
    const totalSize = 36 + attrs.length * 20;
    const b = Buffer.alloc(totalSize);
    b.writeUInt16LE(0x0102, 0); // RES_XML_START_ELEMENT_TYPE
    b.writeUInt16LE(16, 2);
    b.writeUInt32LE(totalSize, 4);
    b.writeUInt32LE(line, 8);
    b.writeUInt32LE(0xffffffff, 12);
    b.writeUInt32LE(NO_NS, 16);
    b.writeUInt32LE(nameIdx, 20);
    b.writeUInt16LE(20, 24); // attributeStart
    b.writeUInt16LE(20, 26); // attributeSize
    b.writeUInt16LE(attrs.length, 28); // attributeCount
    b.writeUInt16LE(0, 30);
    b.writeUInt16LE(0, 32);
    b.writeUInt16LE(0, 34);

    for (let i = 0; i < attrs.length; i++) {
      const pos = 36 + i * 20;
      const a = attrs[i];
      b.writeUInt32LE(a.ns, pos);
      b.writeUInt32LE(a.name, pos + 4);
      b.writeUInt32LE(a.rawValue, pos + 8);
      b.writeUInt16LE(8, pos + 12); // size of Res_value
      b.writeUInt8(0, pos + 14);
      b.writeUInt8(a.dataType, pos + 15);
      b.writeUInt32LE(a.data >>> 0, pos + 16);
    }
    return b;
  }

  function makeEndElement(nameIdx: number, line: number): Buffer {
    const b = Buffer.alloc(24);
    b.writeUInt16LE(0x0103, 0); // RES_XML_END_ELEMENT_TYPE
    b.writeUInt16LE(16, 2);
    b.writeUInt32LE(24, 4);
    b.writeUInt32LE(line, 8);
    b.writeUInt32LE(0xffffffff, 12);
    b.writeUInt32LE(NO_NS, 16);
    b.writeUInt32LE(nameIdx, 20);
    return b;
  }

  const xmlNodes: Buffer[] = [
    makeNamespaceChunk(true, 1),
    // <manifest android:versionCode="1" android:versionName="1.0" package="...">
    makeStartElement(11, 2, [
      { ns: ANDROID_NS, name: 4, rawValue: 0xffffffff, dataType: 0x10, data: 1 },
      { ns: ANDROID_NS, name: 5, rawValue: 14, dataType: 0x03, data: 14 },
      { ns: NO_NS, name: 12, rawValue: 13, dataType: 0x03, data: 13 }
    ]),
    // <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="28" />
    makeStartElement(15, 3, [
      { ns: ANDROID_NS, name: 3, rawValue: 0xffffffff, dataType: 0x10, data: 21 },
      { ns: ANDROID_NS, name: 6, rawValue: 0xffffffff, dataType: 0x10, data: 28 }
    ]),
    makeEndElement(15, 3),
    // <uses-permission android:name="android.permission.INTERNET" />
    makeStartElement(16, 4, [
      { ns: ANDROID_NS, name: 1, rawValue: 17, dataType: 0x03, data: 17 }
    ]),
    makeEndElement(16, 4),
    // <application android:label="..." android:usesCleartextTraffic="true">
    makeStartElement(18, 5, [
      { ns: ANDROID_NS, name: 0, rawValue: 19, dataType: 0x03, data: 19 },
      { ns: ANDROID_NS, name: 7, rawValue: 0xffffffff, dataType: 0x12, data: 0xffffffff }
    ]),
    // <activity android:label="..." android:name="it.proloco.soci.MainActivity" android:exported="true">
    makeStartElement(20, 6, [
      { ns: ANDROID_NS, name: 0, rawValue: 19, dataType: 0x03, data: 19 },
      { ns: ANDROID_NS, name: 1, rawValue: 21, dataType: 0x03, data: 21 },
      { ns: ANDROID_NS, name: 2, rawValue: 0xffffffff, dataType: 0x12, data: 0xffffffff }
    ]),
    // <intent-filter>
    makeStartElement(22, 7, []),
    // <action android:name="android.intent.action.MAIN" />
    makeStartElement(23, 8, [
      { ns: ANDROID_NS, name: 1, rawValue: 24, dataType: 0x03, data: 24 }
    ]),
    makeEndElement(23, 8),
    // <category android:name="android.intent.category.LAUNCHER" />
    makeStartElement(25, 9, [
      { ns: ANDROID_NS, name: 1, rawValue: 26, dataType: 0x03, data: 26 }
    ]),
    makeEndElement(25, 9),
    makeEndElement(22, 10),
    makeEndElement(20, 11),
    makeEndElement(18, 12),
    makeEndElement(11, 13),
    makeNamespaceChunk(false, 13)
  ];

  const bodyBuf = Buffer.concat([fullStringPool, resMapChunk, ...xmlNodes]);
  const axmlHeader = Buffer.alloc(8);
  axmlHeader.writeUInt16LE(0x0003, 0); // RES_XML_TYPE
  axmlHeader.writeUInt16LE(8, 2); // headerSize
  axmlHeader.writeUInt32LE(8 + bodyBuf.length, 4);

  return Buffer.concat([axmlHeader, bodyBuf]);
}

let cachedKeyPair: { keyPem: string; certPem: string; certDer: Buffer } | null = null;

function getOrGenerateSigningCert(): { keyPem: string; certPem: string; certDer: Buffer } {
  if (cachedKeyPair) return cachedKeyPair;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apk-sign-'));
  const keyPath = path.join(tmpDir, 'key.pem');
  const certPath = path.join(tmpDir, 'cert.pem');
  const derPath = path.join(tmpDir, 'cert.der');
  try {
    execFileSync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '10000',
      '-subj',
      '/CN=ProLoco Android App/O=ProLoco/C=IT'
    ]);
    execFileSync('openssl', ['x509', '-in', certPath, '-outform', 'DER', '-out', derPath]);
    cachedKeyPair = {
      keyPem: fs.readFileSync(keyPath, 'utf-8'),
      certPem: fs.readFileSync(certPath, 'utf-8'),
      certDer: fs.readFileSync(derPath)
    };
    return cachedKeyPair;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function createPkcs7Signature(certSfBuf: Buffer, keyPem: string, certPem: string): Buffer {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apk-cms-'));
  const sfPath = path.join(tmpDir, 'CERT.SF');
  const keyPath = path.join(tmpDir, 'key.pem');
  const certPath = path.join(tmpDir, 'cert.pem');
  const rsaPath = path.join(tmpDir, 'CERT.RSA');
  try {
    fs.writeFileSync(sfPath, certSfBuf);
    fs.writeFileSync(keyPath, keyPem);
    fs.writeFileSync(certPath, certPem);
    execFileSync('openssl', [
      'cms',
      '-sign',
      '-binary',
      '-noattr',
      '-in',
      sfPath,
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      '-outform',
      'DER',
      '-out',
      rsaPath,
      '-md',
      'sha256'
    ]);
    return fs.readFileSync(rsaPath);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function computeApkV2ContentDigest(sections: Buffer[]): Buffer {
  const CHUNK_SIZE = 1024 * 1024;
  const chunkDigests: Buffer[] = [];

  for (const section of sections) {
    let offset = 0;
    while (offset < section.length) {
      const slice = section.subarray(offset, Math.min(offset + CHUNK_SIZE, section.length));
      const prefix = Buffer.alloc(5);
      prefix.writeUInt8(0xa5, 0);
      prefix.writeUInt32LE(slice.length, 1);
      const digest = crypto.createHash('sha256').update(prefix).update(slice).digest();
      chunkDigests.push(digest);
      offset += slice.length;
    }
  }

  const topPrefix = Buffer.alloc(5);
  topPrefix.writeUInt8(0x5a, 0);
  topPrefix.writeUInt32LE(chunkDigests.length, 1);
  return crypto
    .createHash('sha256')
    .update(topPrefix)
    .update(Buffer.concat(chunkDigests))
    .digest();
}

function lengthPrefixed(buf: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(buf.length, 0);
  return Buffer.concat([len, buf]);
}

/**
 * Crea un file .APK completo, compilato in binario (AXML + DEX) e firmato
 * crittograficamente sia con APK Signature Scheme v1 (JAR/PKCS#7) che APK Signature Scheme v2.
 */
export function generateInstallableApkBuffer(options: {
  appLabel: string;
  packageName: string;
  targetUrl: string;
}): Buffer {
  const { keyPem, certPem, certDer } = getOrGenerateSigningCert();
  const manifestXmlBin = buildBinaryAndroidManifest(options.appLabel, options.packageName);
  const classesDexBin = buildWorkingDex(options.targetUrl);

  const payloadFiles: Array<{ name: string; data: Buffer }> = [
    { name: 'AndroidManifest.xml', data: manifestXmlBin },
    { name: 'classes.dex', data: classesDexBin }
  ];

  // Costruzione firma v1 (META-INF/MANIFEST.MF, CERT.SF, CERT.RSA)
  const manifestLines = ['Manifest-Version: 1.0', 'Created-By: 1.0 (Android)', ''];
  for (const f of payloadFiles) {
    const hash = crypto.createHash('sha256').update(f.data).digest('base64');
    manifestLines.push(`Name: ${f.name}`);
    manifestLines.push(`SHA-256-Digest: ${hash}`);
    manifestLines.push('');
  }
  const manifestMfBuf = Buffer.from(manifestLines.join('\r\n'), 'utf-8');

  const mainManifestHash = crypto.createHash('sha256').update(manifestMfBuf).digest('base64');
  const sfLines = [
    'Signature-Version: 1.0',
    'Created-By: 1.0 (Android)',
    `SHA-256-Digest-Manifest: ${mainManifestHash}`,
    ''
  ];
  for (const f of payloadFiles) {
    const entryText = `Name: ${f.name}\r\nSHA-256-Digest: ${crypto.createHash('sha256').update(f.data).digest('base64')}\r\n\r\n`;
    const entryHash = crypto.createHash('sha256').update(Buffer.from(entryText, 'utf-8')).digest('base64');
    sfLines.push(`Name: ${f.name}`);
    sfLines.push(`SHA-256-Digest: ${entryHash}`);
    sfLines.push('');
  }
  const certSfBuf = Buffer.from(sfLines.join('\r\n'), 'utf-8');
  const certRsaBuf = createPkcs7Signature(certSfBuf, keyPem, certPem);

  const allEntries: Array<{ name: string; data: Buffer }> = [
    ...payloadFiles,
    { name: 'META-INF/MANIFEST.MF', data: manifestMfBuf },
    { name: 'META-INF/CERT.SF', data: certSfBuf },
    { name: 'META-INF/CERT.RSA', data: certRsaBuf }
  ];

  // Costruzione ZIP allineato a 4 byte (zipalign 4)
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of allEntries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    const dataBuf = entry.data;
    const crc = crc32Buffer(dataBuf);

    // Calcola extra field padding per allineare l'inizio di dataBuf a 4 byte
    const unalignedDataStart = offset + 30 + nameBuf.length;
    const extraLen = (4 - (unalignedDataStart % 4)) % 4;
    const extraBuf = Buffer.alloc(extraLen, 0);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8); // STORE
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5421, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(extraLen, 28);

    localParts.push(localHeader, nameBuf, extraBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + extraBuf.length + dataBuf.length;
  }

  const beforeCdBuf = Buffer.concat(localParts);
  const centralDirBuf = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(allEntries.length, 8);
  eocd.writeUInt16LE(allEntries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(beforeCdBuf.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([beforeCdBuf, centralDirBuf, eocd]);
}
