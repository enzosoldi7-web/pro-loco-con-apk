import express from 'express';
import http from 'http';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// GENERATORE BINARIO .APK NATIVO ANDROID (AXML + ARSC + DEX + V1 JAR + V2 SIG)
// ============================================================================

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32Buffer(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUleb128(value: number): Buffer {
  const bytes: number[] = [];
  let val = value >>> 0;
  do {
    let b = val & 0x7f;
    val >>>= 7;
    if (val !== 0) {
      b |= 0x80;
    }
    bytes.push(b);
  } while (val !== 0);
  return Buffer.from(bytes);
}

function align4(buf: Buffer): Buffer {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem)]);
}

interface AxmlAttr {
  nsIdx: number;
  nameIdx: number;
  rawValueIdx: number;
  valueType: number;
  data: number;
}

function buildBinaryAndroidManifest(packageId: string, appLabel: string): Buffer {
  const attrResourceIds = [
    0x01010000, 0x01010001, 0x01010002, 0x01010003, 0x01010010, 0x0101001f,
    0x0101020c, 0x0101021b, 0x0101021c, 0x01010270, 0x010102d3, 0x010104ec
  ];

  const strings = [
    'theme', 'label', 'icon', 'name', 'exported', 'configChanges',
    'minSdkVersion', 'versionCode', 'versionName', 'targetSdkVersion',
    'hardwareAccelerated', 'usesCleartextTraffic', 'android',
    'http://schemas.android.com/apk/res/android', '', 'package', 'manifest',
    'uses-sdk', 'uses-permission', 'android.permission.INTERNET',
    'application', 'activity', 'it.proloco.app.MainActivity',
    'intent-filter', 'action', 'android.intent.action.MAIN',
    'category', 'android.intent.category.LAUNCHER', '1.0', packageId, appLabel,
    'android.permission.ACCESS_NETWORK_STATE'
  ];

  const NS_ANDROID = 13;
  const encodedStrings: Buffer[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  for (const s of strings) {
    offsets.push(currentOffset);
    const strBuf = Buffer.from(s, 'utf16le');
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(s.length, 0);
    const nullTerm = Buffer.alloc(2, 0);
    const entry = Buffer.concat([lenBuf, strBuf, nullTerm]);
    encodedStrings.push(entry);
    currentOffset += entry.length;
  }

  const rawStringBlock = align4(Buffer.concat(encodedStrings));
  const stringPoolHeaderSize = 28;
  const offsetsSize = strings.length * 4;
  const stringsStart = stringPoolHeaderSize + offsetsSize;
  const stringPoolTotalSize = stringsStart + rawStringBlock.length;

  const stringPoolHeader = Buffer.alloc(stringPoolHeaderSize);
  stringPoolHeader.writeUInt16LE(0x0001, 0);
  stringPoolHeader.writeUInt16LE(stringPoolHeaderSize, 2);
  stringPoolHeader.writeUInt32LE(stringPoolTotalSize, 4);
  stringPoolHeader.writeUInt32LE(strings.length, 8);
  stringPoolHeader.writeUInt32LE(0, 12);
  stringPoolHeader.writeUInt32LE(0, 16);
  stringPoolHeader.writeUInt32LE(stringsStart, 20);
  stringPoolHeader.writeUInt32LE(0, 24);

  const offsetsBuf = Buffer.alloc(offsetsSize);
  offsets.forEach((off, idx) => offsetsBuf.writeUInt32LE(off, idx * 4));
  const stringPoolChunk = Buffer.concat([stringPoolHeader, offsetsBuf, rawStringBlock]);

  const resMapSize = 8 + attrResourceIds.length * 4;
  const resMapChunk = Buffer.alloc(resMapSize);
  resMapChunk.writeUInt16LE(0x0180, 0);
  resMapChunk.writeUInt16LE(8, 2);
  resMapChunk.writeUInt32LE(resMapSize, 4);
  attrResourceIds.forEach((id, idx) => resMapChunk.writeUInt32LE(id, 8 + idx * 4));

  function makeNamespaceChunk(isStart: boolean, prefixIdx: number, uriIdx: number, line: number): Buffer {
    const buf = Buffer.alloc(24);
    buf.writeUInt16LE(isStart ? 0x0100 : 0x0101, 0);
    buf.writeUInt16LE(16, 2);
    buf.writeUInt32LE(24, 4);
    buf.writeUInt32LE(line, 8);
    buf.writeInt32LE(-1, 12);
    buf.writeInt32LE(prefixIdx, 16);
    buf.writeInt32LE(uriIdx, 20);
    return buf;
  }

  function makeStartElement(nameIdx: number, line: number, attrs: AxmlAttr[]): Buffer {
    const chunkSize = 36 + attrs.length * 20;
    const buf = Buffer.alloc(chunkSize);
    buf.writeUInt16LE(0x0102, 0);
    buf.writeUInt16LE(16, 2);
    buf.writeUInt32LE(chunkSize, 4);
    buf.writeUInt32LE(line, 8);
    buf.writeInt32LE(-1, 12);
    buf.writeInt32LE(-1, 16);
    buf.writeInt32LE(nameIdx, 20);
    buf.writeUInt16LE(20, 24);
    buf.writeUInt16LE(20, 26);
    buf.writeUInt16LE(attrs.length, 28);
    buf.writeUInt16LE(0, 30);
    buf.writeUInt16LE(0, 32);
    buf.writeUInt16LE(0, 34);

    attrs.forEach((a, i) => {
      const base = 36 + i * 20;
      buf.writeInt32LE(a.nsIdx, base + 0);
      buf.writeInt32LE(a.nameIdx, base + 4);
      buf.writeInt32LE(a.rawValueIdx, base + 8);
      buf.writeUInt16LE(8, base + 12);
      buf.writeUInt8(0, base + 14);
      buf.writeUInt8(a.valueType, base + 15);
      buf.writeUInt32LE(a.data >>> 0, base + 16);
    });
    return buf;
  }

  function makeEndElement(nameIdx: number, line: number): Buffer {
    const buf = Buffer.alloc(24);
    buf.writeUInt16LE(0x0103, 0);
    buf.writeUInt16LE(16, 2);
    buf.writeUInt32LE(24, 4);
    buf.writeUInt32LE(line, 8);
    buf.writeInt32LE(-1, 12);
    buf.writeInt32LE(-1, 16);
    buf.writeInt32LE(nameIdx, 20);
    return buf;
  }

  const TYPE_REFERENCE = 0x01;
  const TYPE_STRING = 0x03;
  const TYPE_INT_DEC = 0x10;
  const TYPE_INT_HEX = 0x11;
  const TYPE_BOOLEAN = 0x12;

  const xmlNodes: Buffer[] = [
    makeNamespaceChunk(true, 12, NS_ANDROID, 2),
    makeStartElement(16, 2, [
      { nsIdx: NS_ANDROID, nameIdx: 7, rawValueIdx: -1, valueType: TYPE_INT_DEC, data: 1 },
      { nsIdx: NS_ANDROID, nameIdx: 8, rawValueIdx: 28, valueType: TYPE_STRING, data: 28 },
      { nsIdx: -1, nameIdx: 15, rawValueIdx: 29, valueType: TYPE_STRING, data: 29 }
    ]),
    makeStartElement(17, 3, [
      { nsIdx: NS_ANDROID, nameIdx: 6, rawValueIdx: -1, valueType: TYPE_INT_DEC, data: 21 },
      { nsIdx: NS_ANDROID, nameIdx: 9, rawValueIdx: -1, valueType: TYPE_INT_DEC, data: 28 }
    ]),
    makeEndElement(17, 3),
    // uses-permission: INTERNET
    makeStartElement(18, 4, [
      { nsIdx: NS_ANDROID, nameIdx: 3, rawValueIdx: 19, valueType: TYPE_STRING, data: 19 }
    ]),
    makeEndElement(18, 4),
    // uses-permission: ACCESS_NETWORK_STATE
    makeStartElement(18, 5, [
      { nsIdx: NS_ANDROID, nameIdx: 3, rawValueIdx: 31, valueType: TYPE_STRING, data: 31 }
    ]),
    makeEndElement(18, 5),
    makeStartElement(20, 6, [
      { nsIdx: NS_ANDROID, nameIdx: 1, rawValueIdx: 30, valueType: TYPE_STRING, data: 30 },
      { nsIdx: NS_ANDROID, nameIdx: 2, rawValueIdx: -1, valueType: TYPE_REFERENCE, data: 0x7f010000 },
      { nsIdx: NS_ANDROID, nameIdx: 10, rawValueIdx: -1, valueType: TYPE_BOOLEAN, data: 0xffffffff },
      { nsIdx: NS_ANDROID, nameIdx: 11, rawValueIdx: -1, valueType: TYPE_BOOLEAN, data: 0xffffffff }
    ]),
    makeStartElement(21, 7, [
      { nsIdx: NS_ANDROID, nameIdx: 0, rawValueIdx: -1, valueType: TYPE_REFERENCE, data: 0x01030006 },
      { nsIdx: NS_ANDROID, nameIdx: 1, rawValueIdx: 30, valueType: TYPE_STRING, data: 30 },
      { nsIdx: NS_ANDROID, nameIdx: 2, rawValueIdx: -1, valueType: TYPE_REFERENCE, data: 0x7f010000 },
      { nsIdx: NS_ANDROID, nameIdx: 3, rawValueIdx: 22, valueType: TYPE_STRING, data: 22 },
      { nsIdx: NS_ANDROID, nameIdx: 4, rawValueIdx: -1, valueType: TYPE_BOOLEAN, data: 0xffffffff },
      { nsIdx: NS_ANDROID, nameIdx: 5, rawValueIdx: -1, valueType: TYPE_INT_HEX, data: 0x000004a0 }
    ]),
    makeStartElement(23, 8, []),
    makeStartElement(24, 9, [
      { nsIdx: NS_ANDROID, nameIdx: 3, rawValueIdx: 25, valueType: TYPE_STRING, data: 25 }
    ]),
    makeEndElement(24, 9),
    makeStartElement(26, 10, [
      { nsIdx: NS_ANDROID, nameIdx: 3, rawValueIdx: 27, valueType: TYPE_STRING, data: 27 }
    ]),
    makeEndElement(26, 10),
    makeEndElement(23, 11),
    makeEndElement(21, 12),
    makeEndElement(20, 13),
    makeEndElement(16, 14),
    makeNamespaceChunk(false, 12, NS_ANDROID, 14)
  ];

  const body = Buffer.concat([stringPoolChunk, resMapChunk, ...xmlNodes]);
  const header = Buffer.alloc(8);
  header.writeUInt16LE(0x0003, 0);
  header.writeUInt16LE(8, 2);
  header.writeUInt32LE(8 + body.length, 4);

  return Buffer.concat([header, body]);
}

function buildResourcesArsc(packageId: string): Buffer {
  const makeStringPool = (strs: string[]): Buffer => {
    const encoded: Buffer[] = [];
    const offsets: number[] = [];
    let cur = 0;
    for (const s of strs) {
      offsets.push(cur);
      const strBuf = Buffer.from(s, 'utf16le');
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUInt16LE(s.length, 0);
      const nullTerm = Buffer.alloc(2, 0);
      const entry = Buffer.concat([lenBuf, strBuf, nullTerm]);
      encoded.push(entry);
      cur += entry.length;
    }
    const rawStrings = align4(Buffer.concat(encoded));
    const headerSize = 28;
    const offsetsSize = strs.length * 4;
    const stringsStart = headerSize + offsetsSize;
    const totalSize = stringsStart + rawStrings.length;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0x0001, 0);
    header.writeUInt16LE(headerSize, 2);
    header.writeUInt32LE(totalSize, 4);
    header.writeUInt32LE(strs.length, 8);
    header.writeUInt32LE(0, 12);
    header.writeUInt32LE(0, 16);
    header.writeUInt32LE(stringsStart, 20);
    header.writeUInt32LE(0, 24);

    const offsetsBuf = Buffer.alloc(offsetsSize);
    offsets.forEach((off, i) => offsetsBuf.writeUInt32LE(off, i * 4));

    return Buffer.concat([header, offsetsBuf, rawStrings]);
  };

  // Global String Pool: index 0 -> 'res/drawable/icon.png'
  const globalStringPool = makeStringPool(['res/drawable/icon.png']);
  // Type String Pool: index 0 -> 'drawable' (type id 1)
  const typeStringPool = makeStringPool(['drawable']);
  // Key String Pool: index 0 -> 'icon' (entry id 0)
  const keyStringPool = makeStringPool(['icon']);

  // RES_TABLE_TYPE_SPEC_TYPE (0x0202) for type id 1 ('drawable'), 1 entry
  const typeSpecChunk = Buffer.alloc(20);
  typeSpecChunk.writeUInt16LE(0x0202, 0);
  typeSpecChunk.writeUInt16LE(16, 2);
  typeSpecChunk.writeUInt32LE(20, 4);
  typeSpecChunk.writeUInt8(1, 8); // id = 1
  typeSpecChunk.writeUInt8(0, 9);
  typeSpecChunk.writeUInt16LE(0, 10);
  typeSpecChunk.writeUInt32LE(1, 12); // entryCount = 1
  typeSpecChunk.writeUInt32LE(0, 16); // config mask = 0 (default)

  // RES_TABLE_TYPE_TYPE (0x0201) for type id 1 ('drawable'), 1 entry (0x7f010000 -> globalStringPool[0])
  const typeHeaderSize = 56; // 20 bytes fixed header + 36 bytes ResTable_config
  const entryOffsetsSize = 4;
  const entriesStart = typeHeaderSize + entryOffsetsSize; // 60
  const entryDataSize = 16; // ResTable_entry (8 bytes) + Res_value (8 bytes)
  const typeChunkSize = entriesStart + entryDataSize; // 76

  const typeChunk = Buffer.alloc(typeChunkSize, 0);
  typeChunk.writeUInt16LE(0x0201, 0);
  typeChunk.writeUInt16LE(typeHeaderSize, 2);
  typeChunk.writeUInt32LE(typeChunkSize, 4);
  typeChunk.writeUInt8(1, 8); // id = 1
  typeChunk.writeUInt8(0, 9);
  typeChunk.writeUInt16LE(0, 10);
  typeChunk.writeUInt32LE(1, 12); // entryCount = 1
  typeChunk.writeUInt32LE(entriesStart, 16);
  typeChunk.writeUInt32LE(36, 20); // ResTable_config.size = 36 (default config)

  // Entry offset[0] = 0
  typeChunk.writeUInt32LE(0, typeHeaderSize);

  // ResTable_entry at entriesStart (56)
  typeChunk.writeUInt16LE(8, entriesStart + 0); // size = 8
  typeChunk.writeUInt16LE(0, entriesStart + 2); // flags = 0
  typeChunk.writeUInt32LE(0, entriesStart + 4); // key index = 0 ('icon')

  // Res_value at entriesStart + 8 (64)
  typeChunk.writeUInt16LE(8, entriesStart + 8); // size = 8
  typeChunk.writeUInt8(0, entriesStart + 10); // res0 = 0
  typeChunk.writeUInt8(0x03, entriesStart + 11); // dataType = TYPE_STRING (0x03)
  typeChunk.writeUInt32LE(0, entriesStart + 12); // data = 0 ('res/drawable/icon.png')

  const pkgHeaderSize = 288;
  const pkgBody = Buffer.concat([typeStringPool, keyStringPool, typeSpecChunk, typeChunk]);
  const pkgTotalSize = pkgHeaderSize + pkgBody.length;
  const pkgHeader = Buffer.alloc(pkgHeaderSize, 0);
  pkgHeader.writeUInt16LE(0x0200, 0);
  pkgHeader.writeUInt16LE(pkgHeaderSize, 2);
  pkgHeader.writeUInt32LE(pkgTotalSize, 4);
  pkgHeader.writeUInt32LE(0x7f, 8);

  const pkgNameUtf16 = Buffer.from(packageId.slice(0, 127), 'utf16le');
  pkgNameUtf16.copy(pkgHeader, 12);

  pkgHeader.writeUInt32LE(pkgHeaderSize, 268);
  pkgHeader.writeUInt32LE(1, 272); // lastPublicType = 1
  pkgHeader.writeUInt32LE(pkgHeaderSize + typeStringPool.length, 276);
  pkgHeader.writeUInt32LE(1, 280); // lastPublicKey = 1
  pkgHeader.writeUInt32LE(0, 284);

  const pkgChunk = Buffer.concat([pkgHeader, pkgBody]);
  const totalSize = 12 + globalStringPool.length + pkgChunk.length;
  const tableHeader = Buffer.alloc(12);
  tableHeader.writeUInt16LE(0x0002, 0);
  tableHeader.writeUInt16LE(12, 2);
  tableHeader.writeUInt32LE(totalSize, 4);
  tableHeader.writeUInt32LE(1, 8);

  return Buffer.concat([tableHeader, globalStringPool, pkgChunk]);
}

function buildClassesDex(): Buffer {
  const strings = [
    '<init>',
    'I',
    'L',
    'Landroid/app/Activity;',
    'Landroid/content/Context;',
    'Landroid/os/Bundle;',
    'Landroid/view/View;',
    'Landroid/webkit/WebSettings;',
    'Landroid/webkit/WebView;',
    'Landroid/webkit/WebViewClient;',
    'Lit/proloco/app/MainActivity;',
    'Ljava/lang/Object;',
    'Ljava/lang/String;',
    'V',
    'VI',
    'VL',
    'VZ',
    'Z',
    'file:///android_asset/index.html',
    'getSettings',
    'loadUrl',
    'onCreate',
    'setAllowContentAccess',
    'setAllowFileAccess',
    'setAllowFileAccessFromFileURLs',
    'setAllowUniversalAccessFromFileURLs',
    'setContentView',
    'setDatabaseEnabled',
    'setDomStorageEnabled',
    'setJavaScriptEnabled',
    'setMixedContentMode',
    'setWebViewClient'
  ];

  // Sorted type descriptor indices into `strings`:
  // 0: I (1)
  // 1: Landroid/app/Activity; (3)
  // 2: Landroid/content/Context; (4)
  // 3: Landroid/os/Bundle; (5)
  // 4: Landroid/view/View; (6)
  // 5: Landroid/webkit/WebSettings; (7)
  // 6: Landroid/webkit/WebView; (8)
  // 7: Landroid/webkit/WebViewClient; (9)
  // 8: Lit/proloco/app/MainActivity; (10)
  // 9: Ljava/lang/Object; (11)
  // 10: Ljava/lang/String; (12)
  // 11: V (13)
  // 12: Z (17)
  const typeDescriptorIndices = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17];

  // Sorted protos by (returnTypeIdx, paramTypeIdx):
  // 0: ()Landroid/webkit/WebSettings; -> shorty 'L'(2), ret 5, param null
  // 1: ()V -> shorty 'V'(13), ret 11, param null
  // 2: (I)V -> shorty 'VI'(14), ret 11, param 0 ('I')
  // 3: (Landroid/content/Context;)V -> shorty 'VL'(15), ret 11, param 2
  // 4: (Landroid/os/Bundle;)V -> shorty 'VL'(15), ret 11, param 3
  // 5: (Landroid/view/View;)V -> shorty 'VL'(15), ret 11, param 4
  // 6: (Landroid/webkit/WebViewClient;)V -> shorty 'VL'(15), ret 11, param 7
  // 7: (Ljava/lang/String;)V -> shorty 'VL'(15), ret 11, param 10
  // 8: (Z)V -> shorty 'VZ'(16), ret 11, param 12
  const protos = [
    { shortyIdx: 2, returnTypeIdx: 5, paramTypeIdx: null },
    { shortyIdx: 13, returnTypeIdx: 11, paramTypeIdx: null },
    { shortyIdx: 14, returnTypeIdx: 11, paramTypeIdx: 0 },
    { shortyIdx: 15, returnTypeIdx: 11, paramTypeIdx: 2 },
    { shortyIdx: 15, returnTypeIdx: 11, paramTypeIdx: 3 },
    { shortyIdx: 15, returnTypeIdx: 11, paramTypeIdx: 4 },
    { shortyIdx: 15, returnTypeIdx: 11, paramTypeIdx: 7 },
    { shortyIdx: 15, returnTypeIdx: 11, paramTypeIdx: 10 },
    { shortyIdx: 16, returnTypeIdx: 11, paramTypeIdx: 12 }
  ];

  // Sorted methods by (classIdx, nameIdx, protoIdx):
  // 0: Activity.<init>()V
  // 1: Activity.onCreate(Bundle)V
  // 2: Activity.setContentView(View)V
  // 3: WebSettings.setAllowContentAccess(Z)V
  // 4: WebSettings.setAllowFileAccess(Z)V
  // 5: WebSettings.setAllowFileAccessFromFileURLs(Z)V
  // 6: WebSettings.setAllowUniversalAccessFromFileURLs(Z)V
  // 7: WebSettings.setDatabaseEnabled(Z)V
  // 8: WebSettings.setDomStorageEnabled(Z)V
  // 9: WebSettings.setJavaScriptEnabled(Z)V
  // 10: WebSettings.setMixedContentMode(I)V
  // 11: WebView.<init>(Context)V
  // 12: WebView.getSettings()WebSettings
  // 13: WebView.loadUrl(String)V
  // 14: WebView.setWebViewClient(WebViewClient)V
  // 15: WebViewClient.<init>()V
  // 16: MainActivity.<init>()V
  // 17: MainActivity.onCreate(Bundle)V
  const methods = [
    { classIdx: 1, protoIdx: 1, nameIdx: 0 },
    { classIdx: 1, protoIdx: 4, nameIdx: 21 },
    { classIdx: 1, protoIdx: 5, nameIdx: 26 },
    { classIdx: 5, protoIdx: 8, nameIdx: 22 },
    { classIdx: 5, protoIdx: 8, nameIdx: 23 },
    { classIdx: 5, protoIdx: 8, nameIdx: 24 },
    { classIdx: 5, protoIdx: 8, nameIdx: 25 },
    { classIdx: 5, protoIdx: 8, nameIdx: 27 },
    { classIdx: 5, protoIdx: 8, nameIdx: 28 },
    { classIdx: 5, protoIdx: 8, nameIdx: 29 },
    { classIdx: 5, protoIdx: 2, nameIdx: 30 },
    { classIdx: 6, protoIdx: 3, nameIdx: 0 },
    { classIdx: 6, protoIdx: 0, nameIdx: 19 },
    { classIdx: 6, protoIdx: 7, nameIdx: 20 },
    { classIdx: 6, protoIdx: 6, nameIdx: 31 },
    { classIdx: 7, protoIdx: 1, nameIdx: 0 },
    { classIdx: 8, protoIdx: 1, nameIdx: 0 },
    { classIdx: 8, protoIdx: 4, nameIdx: 21 }
  ];

  const headerSize = 0x70;
  const stringIdsOff = 0x70;
  const typeIdsOff = stringIdsOff + strings.length * 4;
  const protoIdsOff = typeIdsOff + typeDescriptorIndices.length * 4;
  const methodIdsOff = protoIdsOff + protos.length * 12;
  const classDefsOff = methodIdsOff + methods.length * 8;
  const dataStartOff = classDefsOff + 32;

  let curDataOff = dataStartOff;

  const codeInitOff = curDataOff;
  const codeInitBuf = Buffer.alloc(24);
  codeInitBuf.writeUInt16LE(1, 0);
  codeInitBuf.writeUInt16LE(1, 2);
  codeInitBuf.writeUInt16LE(1, 4);
  codeInitBuf.writeUInt16LE(0, 6);
  codeInitBuf.writeUInt32LE(0, 8);
  codeInitBuf.writeUInt32LE(4, 12);
  codeInitBuf[16] = 0x70;
  codeInitBuf[17] = 0x10;
  codeInitBuf.writeUInt16LE(0, 18); // method 0: Activity.<init>()V
  codeInitBuf.writeUInt16LE(0, 20);
  codeInitBuf[22] = 0x0e;
  codeInitBuf[23] = 0x00;
  curDataOff += codeInitBuf.length;

  // MainActivity.onCreate(Bundle)V
  // registers_size = 5 (v0, v1, v2, v3=this, v4=savedInstanceState)
  const insnsOnCreate = Buffer.from([
    // invoke-super {v3, v4}, Activity.onCreate (method 1)
    0x6f, 0x20, 0x01, 0x00, 0x43, 0x00,
    // new-instance v0, WebView (type 6)
    0x22, 0x00, 0x06, 0x00,
    // invoke-direct {v0, v3}, WebView.<init>(Context) (method 11 = 0x000b)
    0x70, 0x20, 0x0b, 0x00, 0x30, 0x00,
    // invoke-virtual {v0}, WebView.getSettings() (method 12 = 0x000c)
    0x6e, 0x10, 0x0c, 0x00, 0x00, 0x00,
    // move-result-object v1
    0x0c, 0x01,
    // const/4 v2, 1
    0x12, 0x12,
    // invoke-virtual {v1, v2}, WebSettings.setAllowContentAccess(true) (method 3)
    0x6e, 0x20, 0x03, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setAllowFileAccess(true) (method 4)
    0x6e, 0x20, 0x04, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setAllowFileAccessFromFileURLs(true) (method 5)
    0x6e, 0x20, 0x05, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setAllowUniversalAccessFromFileURLs(true) (method 6)
    0x6e, 0x20, 0x06, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setDatabaseEnabled(true) (method 7)
    0x6e, 0x20, 0x07, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setDomStorageEnabled(true) (method 8)
    0x6e, 0x20, 0x08, 0x00, 0x21, 0x00,
    // invoke-virtual {v1, v2}, WebSettings.setJavaScriptEnabled(true) (method 9)
    0x6e, 0x20, 0x09, 0x00, 0x21, 0x00,
    // const/4 v2, 0
    0x12, 0x02,
    // invoke-virtual {v1, v2}, WebSettings.setMixedContentMode(0) (method 10 = 0x000a)
    0x6e, 0x20, 0x0a, 0x00, 0x21, 0x00,
    // new-instance v2, WebViewClient (type 7)
    0x22, 0x02, 0x07, 0x00,
    // invoke-direct {v2}, WebViewClient.<init>() (method 15 = 0x000f)
    0x70, 0x10, 0x0f, 0x00, 0x02, 0x00,
    // invoke-virtual {v0, v2}, WebView.setWebViewClient(v2) (method 14 = 0x000e)
    0x6e, 0x20, 0x0e, 0x00, 0x20, 0x00,
    // invoke-virtual {v3, v0}, Activity.setContentView(v0) (method 2)
    0x6e, 0x20, 0x02, 0x00, 0x03, 0x00,
    // const-string v1, "file:///android_asset/index.html" (string 18 = 0x0012)
    0x1a, 0x01, 0x12, 0x00,
    // invoke-virtual {v0, v1}, WebView.loadUrl(v1) (method 13 = 0x000d)
    0x6e, 0x20, 0x0d, 0x00, 0x10, 0x00,
    // return-void
    0x0e, 0x00
  ]);

  const codeOnCreateOff = curDataOff;
  const codeOnCreateHeader = Buffer.alloc(16);
  codeOnCreateHeader.writeUInt16LE(5, 0);
  codeOnCreateHeader.writeUInt16LE(2, 2);
  codeOnCreateHeader.writeUInt16LE(2, 4);
  codeOnCreateHeader.writeUInt16LE(0, 6);
  codeOnCreateHeader.writeUInt32LE(0, 8);
  codeOnCreateHeader.writeUInt32LE(insnsOnCreate.length / 2, 12);
  const codeOnCreateBuf = Buffer.concat([codeOnCreateHeader, insnsOnCreate]);
  curDataOff += codeOnCreateBuf.length;

  const stringDataOffsets: number[] = [];
  const stringDataBuffers: Buffer[] = [];
  for (const s of strings) {
    stringDataOffsets.push(curDataOff);
    const utf8 = Buffer.from(s, 'utf-8');
    const uleb = writeUleb128(s.length);
    const item = Buffer.concat([uleb, utf8, Buffer.from([0])]);
    stringDataBuffers.push(item);
    curDataOff += item.length;
  }
  const allStringsBuf = Buffer.concat(stringDataBuffers);

  const classDataOff = curDataOff;
  const classDataRaw = Buffer.concat([
    writeUleb128(0),
    writeUleb128(0),
    writeUleb128(1), // 1 direct method (MainActivity.<init> = method 16)
    writeUleb128(1), // 1 virtual method (MainActivity.onCreate = method 17)
    writeUleb128(16),
    writeUleb128(0x10001),
    writeUleb128(codeInitOff),
    writeUleb128(17),
    writeUleb128(0x0004),
    writeUleb128(codeOnCreateOff)
  ]);
  curDataOff += classDataRaw.length;

  const padBeforeTypeListLen = (4 - (curDataOff % 4)) % 4;
  const padBeforeTypeList = Buffer.alloc(padBeforeTypeListLen, 0);
  curDataOff += padBeforeTypeListLen;

  const typeListStartOff = curDataOff;
  const protoParamOffsets: number[] = [];
  const typeListBuffers: Buffer[] = [];
  for (const p of protos) {
    if (p.paramTypeIdx === null) {
      protoParamOffsets.push(0);
    } else {
      protoParamOffsets.push(curDataOff);
      const tl = Buffer.alloc(8);
      tl.writeUInt32LE(1, 0);
      tl.writeUInt16LE(p.paramTypeIdx, 4);
      tl.writeUInt16LE(0, 6);
      typeListBuffers.push(tl);
      curDataOff += 8;
    }
  }

  const mapOff = curDataOff;
  const mapEntries: Array<{ type: number; size: number; offset: number }> = [
    { type: 0x0000, size: 1, offset: 0 },
    { type: 0x0001, size: strings.length, offset: stringIdsOff },
    { type: 0x0002, size: typeDescriptorIndices.length, offset: typeIdsOff },
    { type: 0x0003, size: protos.length, offset: protoIdsOff },
    { type: 0x0005, size: methods.length, offset: methodIdsOff },
    { type: 0x0006, size: 1, offset: classDefsOff },
    { type: 0x2001, size: 2, offset: codeInitOff },
    { type: 0x2002, size: strings.length, offset: stringDataOffsets[0] },
    { type: 0x2000, size: 1, offset: classDataOff },
    { type: 0x1001, size: typeListBuffers.length, offset: typeListStartOff },
    { type: 0x1000, size: 1, offset: mapOff }
  ];

  const mapListBuf = Buffer.alloc(4 + mapEntries.length * 12);
  mapListBuf.writeUInt32LE(mapEntries.length, 0);
  mapEntries.forEach((m, idx) => {
    const base = 4 + idx * 12;
    mapListBuf.writeUInt16LE(m.type, base + 0);
    mapListBuf.writeUInt16LE(0, base + 2);
    mapListBuf.writeUInt32LE(m.size, base + 4);
    mapListBuf.writeUInt32LE(m.offset, base + 8);
  });

  const totalFileSize = mapOff + mapListBuf.length;
  const dataSize = totalFileSize - dataStartOff;

  const stringIdsBuf = Buffer.alloc(strings.length * 4);
  stringDataOffsets.forEach((off, i) => stringIdsBuf.writeUInt32LE(off, i * 4));

  const typeIdsBuf = Buffer.alloc(typeDescriptorIndices.length * 4);
  typeDescriptorIndices.forEach((sIdx, i) => typeIdsBuf.writeUInt32LE(sIdx, i * 4));

  const protoIdsBuf = Buffer.alloc(protos.length * 12);
  protos.forEach((p, i) => {
    protoIdsBuf.writeUInt32LE(p.shortyIdx, i * 12 + 0);
    protoIdsBuf.writeUInt32LE(p.returnTypeIdx, i * 12 + 4);
    protoIdsBuf.writeUInt32LE(protoParamOffsets[i], i * 12 + 8);
  });

  const methodIdsBuf = Buffer.alloc(methods.length * 8);
  methods.forEach((m, i) => {
    methodIdsBuf.writeUInt16LE(m.classIdx, i * 8 + 0);
    methodIdsBuf.writeUInt16LE(m.protoIdx, i * 8 + 2);
    methodIdsBuf.writeUInt32LE(m.nameIdx, i * 8 + 4);
  });

  const classDefsBuf = Buffer.alloc(32);
  classDefsBuf.writeUInt32LE(8, 0); // classIdx 8: Lit/proloco/app/MainActivity;
  classDefsBuf.writeUInt32LE(0x0001, 4); // ACC_PUBLIC
  classDefsBuf.writeUInt32LE(1, 8); // superclassIdx 1: Landroid/app/Activity;
  classDefsBuf.writeUInt32LE(0, 12);
  classDefsBuf.writeUInt32LE(0xffffffff, 16);
  classDefsBuf.writeUInt32LE(0, 20);
  classDefsBuf.writeUInt32LE(classDataOff, 24);
  classDefsBuf.writeUInt32LE(0, 28);

  const headerBuf = Buffer.alloc(headerSize);
  headerBuf.write('dex\n035\0', 0, 'ascii');
  headerBuf.writeUInt32LE(totalFileSize, 32);
  headerBuf.writeUInt32LE(headerSize, 36);
  headerBuf.writeUInt32LE(0x12345678, 40);
  headerBuf.writeUInt32LE(0, 44);
  headerBuf.writeUInt32LE(0, 48);
  headerBuf.writeUInt32LE(mapOff, 52);
  headerBuf.writeUInt32LE(strings.length, 56);
  headerBuf.writeUInt32LE(stringIdsOff, 60);
  headerBuf.writeUInt32LE(typeDescriptorIndices.length, 64);
  headerBuf.writeUInt32LE(typeIdsOff, 68);
  headerBuf.writeUInt32LE(protos.length, 72);
  headerBuf.writeUInt32LE(protoIdsOff, 76);
  headerBuf.writeUInt32LE(0, 80);
  headerBuf.writeUInt32LE(0, 84);
  headerBuf.writeUInt32LE(methods.length, 88);
  headerBuf.writeUInt32LE(methodIdsOff, 92);
  headerBuf.writeUInt32LE(1, 96);
  headerBuf.writeUInt32LE(classDefsOff, 100);
  headerBuf.writeUInt32LE(dataSize, 104);
  headerBuf.writeUInt32LE(dataStartOff, 108);

  const dex = Buffer.concat([
    headerBuf,
    stringIdsBuf,
    typeIdsBuf,
    protoIdsBuf,
    methodIdsBuf,
    classDefsBuf,
    codeInitBuf,
    codeOnCreateBuf,
    allStringsBuf,
    classDataRaw,
    padBeforeTypeList,
    ...typeListBuffers,
    mapListBuf
  ]);

  const sha1 = crypto.createHash('sha1').update(dex.subarray(32)).digest();
  sha1.copy(dex, 12);

  let a = 1;
  let b = 0;
  for (let i = 12; i < dex.length; i++) {
    a = (a + dex[i]) % 65521;
    b = (b + a) % 65521;
  }
  dex.writeUInt32LE(((b << 16) | a) >>> 0, 8);

  return dex;
}

function derLen(len: number): Buffer {
  if (len < 128) return Buffer.from([len]);
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function derTag(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), derLen(content.length), content]);
}

function derSeq(...items: Buffer[]): Buffer {
  return derTag(0x30, Buffer.concat(items));
}

function derSet(...items: Buffer[]): Buffer {
  return derTag(0x31, Buffer.concat(items));
}

function derOid(oidBytes: number[]): Buffer {
  return derTag(0x06, Buffer.from(oidBytes));
}

function derInteger(numBuf: Buffer): Buffer {
  let b = numBuf;
  while (b.length > 1 && b[0] === 0 && (b[1] & 0x80) === 0) {
    b = b.subarray(1);
  }
  if (b[0] & 0x80) {
    b = Buffer.concat([Buffer.from([0x00]), b]);
  }
  return derTag(0x02, b);
}

function derUtf8String(str: string): Buffer {
  return derTag(0x0c, Buffer.from(str, 'utf-8'));
}

function derUtcTime(dateStr: string): Buffer {
  return derTag(0x17, Buffer.from(dateStr, 'ascii'));
}

function derBitString(content: Buffer): Buffer {
  return derTag(0x03, Buffer.concat([Buffer.from([0x00]), content]));
}

function derOctetString(content: Buffer): Buffer {
  return derTag(0x04, content);
}

let cachedSigner: { privateKey: crypto.KeyObject; certDer: Buffer } | null = null;

function getOrCreateSigner(): { privateKey: crypto.KeyObject; certDer: Buffer; nameDer: Buffer } {
  if (cachedSigner) return cachedSigner as any;

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
  });

  const spkiDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;

  const sha256WithRSA = derSeq(
    derOid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]),
    Buffer.from([0x05, 0x00])
  );

  const cAttr = derSet(
    derSeq(derOid([0x55, 0x04, 0x06]), derUtf8String('IT'))
  );
  const oAttr = derSet(
    derSeq(derOid([0x55, 0x04, 0x0a]), derUtf8String('Associazione Pro Loco'))
  );
  const cnAttr = derSet(
    derSeq(derOid([0x55, 0x04, 0x03]), derUtf8String('ProLoco Android Official'))
  );
  const nameDer = derSeq(cAttr, oAttr, cnAttr);

  const validityDer = derSeq(
    derUtcTime('240101000000Z'),
    derUtcTime('491231235959Z')
  );

  const versionDer = derTag(0xa0, derInteger(Buffer.from([0x02])));
  const serialDer = derInteger(Buffer.from([0x01]));

  const tbsCertificate = derSeq(
    versionDer,
    serialDer,
    sha256WithRSA,
    nameDer,
    validityDer,
    nameDer,
    spkiDer
  );

  const certSig = crypto.sign('sha256', tbsCertificate, privateKey);
  const certDer = derSeq(tbsCertificate, sha256WithRSA, derBitString(certSig));

  cachedSigner = { privateKey, certDer, nameDer } as any;
  return cachedSigner as any;
}

function buildPkcs7CertRsa(certSfBuffer: Buffer): Buffer {
  const { privateKey, certDer, nameDer } = getOrCreateSigner() as any;
  const signature = crypto.sign('sha256', certSfBuffer, privateKey);

  const oidData = derOid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01]);
  const oidSignedData = derOid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x02]);
  const algSha256 = derSeq(
    derOid([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01]),
    Buffer.from([0x05, 0x00])
  );
  const algRsaEncryption = derSeq(
    derOid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]),
    Buffer.from([0x05, 0x00])
  );

  const issuerAndSerial = derSeq(nameDer, derInteger(Buffer.from([0x01])));

  const signerInfo = derSeq(
    derInteger(Buffer.from([0x01])),
    issuerAndSerial,
    algSha256,
    algRsaEncryption,
    derOctetString(signature)
  );

  const signedData = derSeq(
    derInteger(Buffer.from([0x01])),
    derSet(algSha256),
    derSeq(oidData),
    derTag(0xa0, certDer),
    derSet(signerInfo)
  );

  return derSeq(oidSignedData, derTag(0xa0, signedData));
}

function lengthPrefixed(buf: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(buf.length, 0);
  return Buffer.concat([len, buf]);
}

function computeV2SectionChunks(section: Buffer): Buffer[] {
  const CHUNK_SIZE = 1024 * 1024;
  const digests: Buffer[] = [];
  for (let offset = 0; offset < section.length; offset += CHUNK_SIZE) {
    const chunk = section.subarray(offset, Math.min(offset + CHUNK_SIZE, section.length));
    const header = Buffer.alloc(5);
    header[0] = 0xa5;
    header.writeUInt32LE(chunk.length, 1);
    const d = crypto.createHash('sha256').update(header).update(chunk).digest();
    digests.push(d);
  }
  return digests;
}

function buildApkSignatureSchemeV2Block(
  localFilesBuf: Buffer,
  centralDirBuf: Buffer,
  eocdBufForDigest: Buffer
): Buffer {
  const { privateKey, certDer } = getOrCreateSigner();

  const chunkDigests = [
    ...computeV2SectionChunks(localFilesBuf),
    ...computeV2SectionChunks(centralDirBuf),
    ...computeV2SectionChunks(eocdBufForDigest)
  ];

  const topHeader = Buffer.alloc(5);
  topHeader[0] = 0x5a;
  topHeader.writeUInt32LE(chunkDigests.length, 1);
  const topLevelDigest = crypto
    .createHash('sha256')
    .update(topHeader)
    .update(Buffer.concat(chunkDigests))
    .digest();

  const algIdBuf = Buffer.alloc(4);
  algIdBuf.writeUInt32LE(0x0103, 0);

  const digestEntry = lengthPrefixed(Buffer.concat([algIdBuf, lengthPrefixed(topLevelDigest)]));
  const digestsSeq = lengthPrefixed(digestEntry);
  const certsSeq = lengthPrefixed(lengthPrefixed(certDer));
  const additionalAttrsSeq = lengthPrefixed(Buffer.alloc(0));

  const signedData = Buffer.concat([digestsSeq, certsSeq, additionalAttrsSeq]);
  const sigBytes = crypto.sign('sha256', signedData, privateKey);

  const signatureEntry = lengthPrefixed(Buffer.concat([algIdBuf, lengthPrefixed(sigBytes)]));
  const signaturesSeq = lengthPrefixed(signatureEntry);

  const spkiDer = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' }) as Buffer;

  const signerBlock = lengthPrefixed(
    Buffer.concat([
      lengthPrefixed(signedData),
      signaturesSeq,
      lengthPrefixed(spkiDer)
    ])
  );

  const v2SchemeValue = lengthPrefixed(signerBlock);

  const pairLen = 4 + v2SchemeValue.length;
  const pairHeader = Buffer.alloc(12);
  pairHeader.writeBigUInt64LE(BigInt(pairLen), 0);
  pairHeader.writeUInt32LE(0x7109871a, 8);
  const pairBuf = Buffer.concat([pairHeader, v2SchemeValue]);

  const blockSizeFieldValue = pairBuf.length + 8 + 16;
  const blockHead = Buffer.alloc(8);
  blockHead.writeBigUInt64LE(BigInt(blockSizeFieldValue), 0);

  const blockTail = Buffer.alloc(24);
  blockTail.writeBigUInt64LE(BigInt(blockSizeFieldValue), 0);
  blockTail.write('APK Sig Block 42', 8, 'ascii');

  return Buffer.concat([blockHead, pairBuf, blockTail]);
}

function buildSignedAndroidApk(params: {
  packageId: string;
  appLabel: string;
  launcherHtml: string;
  configJson: string;
  iconBuffer?: Buffer;
}): Buffer {
  const manifestXmlBin = buildBinaryAndroidManifest(params.packageId, params.appLabel);
  const resourcesArscBin = buildResourcesArsc(params.packageId);
  const classesDexBin = buildClassesDex();

  const payloadFiles: Array<{ name: string; data: Buffer }> = [
    { name: 'AndroidManifest.xml', data: manifestXmlBin },
    { name: 'resources.arsc', data: resourcesArscBin },
    { name: 'classes.dex', data: classesDexBin },
    { name: 'assets/index.html', data: Buffer.from(params.launcherHtml, 'utf-8') },
    { name: 'assets/config_socio.json', data: Buffer.from(params.configJson, 'utf-8') }
  ];

  if (params.iconBuffer && params.iconBuffer.length > 0) {
    payloadFiles.push({ name: 'res/drawable/icon.png', data: params.iconBuffer });
    payloadFiles.push({ name: 'assets/icon.png', data: params.iconBuffer });
  }

  const manifestMainSection = 'Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n';
  let manifestBody = manifestMainSection;
  let sfEntriesBody = '';

  for (const f of payloadFiles) {
    const fileSha256 = crypto.createHash('sha256').update(f.data).digest('base64');
    const fileSha1 = crypto.createHash('sha1').update(f.data).digest('base64');
    const manifestEntryBlock =
      `Name: ${f.name}\r\n` +
      `SHA-256-Digest: ${fileSha256}\r\n` +
      `SHA1-Digest: ${fileSha1}\r\n\r\n`;
    manifestBody += manifestEntryBlock;

    const entrySectionSha256 = crypto
      .createHash('sha256')
      .update(Buffer.from(manifestEntryBlock, 'utf-8'))
      .digest('base64');
    const entrySectionSha1 = crypto
      .createHash('sha1')
      .update(Buffer.from(manifestEntryBlock, 'utf-8'))
      .digest('base64');
    sfEntriesBody +=
      `Name: ${f.name}\r\n` +
      `SHA-256-Digest: ${entrySectionSha256}\r\n` +
      `SHA1-Digest: ${entrySectionSha1}\r\n\r\n`;
  }

  const manifestMfBuf = Buffer.from(manifestBody, 'utf-8');
  const manifestMainHash256 = crypto
    .createHash('sha256')
    .update(Buffer.from(manifestMainSection, 'utf-8'))
    .digest('base64');
  const manifestMainHash1 = crypto
    .createHash('sha1')
    .update(Buffer.from(manifestMainSection, 'utf-8'))
    .digest('base64');
  const fullManifestHash256 = crypto.createHash('sha256').update(manifestMfBuf).digest('base64');
  const fullManifestHash1 = crypto.createHash('sha1').update(manifestMfBuf).digest('base64');

  const certSfContent =
    `Signature-Version: 1.0\r\n` +
    `Created-By: 1.0 (Android)\r\n` +
    `SHA-256-Digest-Manifest: ${fullManifestHash256}\r\n` +
    `SHA1-Digest-Manifest: ${fullManifestHash1}\r\n` +
    `SHA-256-Digest-Manifest-Main-Attributes: ${manifestMainHash256}\r\n` +
    `SHA1-Digest-Manifest-Main-Attributes: ${manifestMainHash1}\r\n` +
    `X-Android-APK-Signed: 2\r\n\r\n` +
    sfEntriesBody;

  const certSfBuf = Buffer.from(certSfContent, 'utf-8');
  const certRsaBuf = buildPkcs7CertRsa(certSfBuf);

  const allEntries: Array<{ name: string; data: Buffer }> = [
    ...payloadFiles,
    { name: 'META-INF/MANIFEST.MF', data: manifestMfBuf },
    { name: 'META-INF/CERT.SF', data: certSfBuf },
    { name: 'META-INF/CERT.RSA', data: certRsaBuf }
  ];

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of allEntries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    const dataBuf = entry.data;
    const crc = crc32Buffer(dataBuf);

    const unalignedDataStart = offset + 30 + nameBuf.length;
    const extraLen = (4 - (unalignedDataStart % 4)) % 4;
    const extraBuf = Buffer.alloc(extraLen, 0);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
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
    centralHeader.writeUInt16LE(extraLen, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf, extraBuf);
    offset += localHeader.length + nameBuf.length + extraBuf.length + dataBuf.length;
  }

  const localFilesBuf = Buffer.concat(localParts);
  const centralDirBuf = Buffer.concat(centralParts);

  const eocdForDigest = Buffer.alloc(22);
  eocdForDigest.writeUInt32LE(0x06054b50, 0);
  eocdForDigest.writeUInt16LE(0, 4);
  eocdForDigest.writeUInt16LE(0, 6);
  eocdForDigest.writeUInt16LE(allEntries.length, 8);
  eocdForDigest.writeUInt16LE(allEntries.length, 10);
  eocdForDigest.writeUInt32LE(centralDirBuf.length, 12);
  eocdForDigest.writeUInt32LE(localFilesBuf.length, 16);
  eocdForDigest.writeUInt16LE(0, 20);

  const v2SigBlock = buildApkSignatureSchemeV2Block(localFilesBuf, centralDirBuf, eocdForDigest);

  const finalEocd = Buffer.from(eocdForDigest);
  finalEocd.writeUInt32LE(localFilesBuf.length + v2SigBlock.length, 16);

  return Buffer.concat([localFilesBuf, v2SigBlock, centralDirBuf, finalEocd]);
}

function buildZipContainer(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    const dataBuf = entry.data;
    const crc = crc32Buffer(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5421, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, dataBuf);

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
    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const localFilesBuf = Buffer.concat(localParts);
  const centralDirBuf = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(localFilesBuf.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localFilesBuf, centralDirBuf, eocd]);
}

let DATA_DIR = path.join(os.tmpdir(), 'proloco_gestionale_db');
let DB_FILE = path.join(DATA_DIR, 'proloco_db.json');
const PROJECT_DATA_DIR = path.join(__dirname, '.data');
const PROJECT_DB_FILE = path.join(PROJECT_DATA_DIR, 'proloco_db.json');

function getLocalLanIps(): string[] {
  const ips: string[] = [];
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      const list = nets[name] || [];
      for (const net of list) {
        if (net && net.family === 'IPv4' && !net.internal && net.address) {
          ips.push(net.address);
        }
      }
    }
  } catch {
    // ignore
  }
  return Array.from(new Set(ips));
}

// Se esiste un file precedente in .data nella cartella di progetto o in tmp, sincronizza entrambi all'avvio
try {
  if (fs.existsSync(PROJECT_DB_FILE) && !fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.copyFileSync(PROJECT_DB_FILE, DB_FILE);
  } else if (fs.existsSync(DB_FILE) && !fs.existsSync(PROJECT_DB_FILE)) {
    fs.mkdirSync(PROJECT_DATA_DIR, { recursive: true });
    fs.copyFileSync(DB_FILE, PROJECT_DB_FILE);
  }
} catch {
  // ignore
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    DATA_DIR = path.join(os.tmpdir(), 'proloco_data');
    DB_FILE = path.join(DATA_DIR, 'proloco_db.json');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
}

function readDbFromDisk() {
  try {
    ensureDataDir();
    let candidateTmp: any = null;
    let candidateProj: any = null;
    if (fs.existsSync(DB_FILE)) {
      try {
        candidateTmp = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch {
        candidateTmp = null;
      }
    }
    if (fs.existsSync(PROJECT_DB_FILE)) {
      try {
        candidateProj = JSON.parse(fs.readFileSync(PROJECT_DB_FILE, 'utf-8'));
      } catch {
        candidateProj = null;
      }
    }
    if (candidateTmp && candidateProj) {
      const tsTmp = Number(candidateTmp.server_updated_at || candidateTmp.updatedAt || 0);
      const tsProj = Number(candidateProj.server_updated_at || candidateProj.updatedAt || 0);
      return tsProj > tsTmp ? candidateProj : candidateTmp;
    }
    return candidateTmp || candidateProj || null;
  } catch (err) {
    console.error('Errore lettura database su disco:', err);
    return null;
  }
}

let lastSavedDbJson = '';

function writeDbToDisk(data) {
  try {
    ensureDataDir();
    const { updatedAt, server_updated_at, ...rest } = data || {};
    const restJson = JSON.stringify(rest);
    if (restJson === lastSavedDbJson && fs.existsSync(DB_FILE)) {
      return;
    }
    lastSavedDbJson = restJson;
    const serialized = JSON.stringify(data, null, 2);
    // Scrittura atomica e idempotente (file temporaneo + rename) sia in os.tmpdir() sia in .data/ del progetto locale
    const tmpFile = `${DB_FILE}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpFile, serialized, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    try {
      if (!fs.existsSync(PROJECT_DATA_DIR)) {
        fs.mkdirSync(PROJECT_DATA_DIR, { recursive: true });
      }
      const projTmpFile = `${PROJECT_DB_FILE}.tmp.${process.pid}.${Date.now()}`;
      fs.writeFileSync(projTmpFile, serialized, 'utf-8');
      fs.renameSync(projTmpFile, PROJECT_DB_FILE);
    } catch {
      // ignore se il filesystem di progetto è sola lettura
    }
  } catch (err) {
    console.error('Errore scrittura database su disco:', err);
  }
}

const PERMANENT_BRIDGE_TRYCLOUDFLARE_URL = process.env.PERMANENT_BRIDGE_URL || '';

const PUBLIC_CLOUD_PORTAL_ORIGIN =
  process.env.PUBLIC_PORTAL_URL || '';

let activeTryCloudflareUrl: string = '';
let activeTunnelInstance: any = null;
let isStartingTunnel = false;

interface SseClient {
  id: string;
  res: express.Response;
  clientInfo?: {
    numeroTessera?: string;
    versionCode?: number;
    userAgent?: string;
    ip?: string;
  };
}
const sseClients: SseClient[] = [];

interface RegisteredApkDevice {
  numeroTessera?: string;
  versionCode?: number;
  lastSeenAt: number;
  ip?: string;
  callbackUrl?: string;
}
const registeredApkClients = new Map<string, RegisteredApkDevice>();

function broadcastServerDbUpdate(db: any) {
  const payload = JSON.stringify({
    type: 'db_update',
    updatedAt: db?.updatedAt || Date.now(),
    server_updated_at: db?.server_updated_at || db?.updatedAt || Date.now(),
    tunnelUrl: activeTryCloudflareUrl || PERMANENT_BRIDGE_TRYCLOUDFLARE_URL
  });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

const PROLOCO_RELAY_TOPIC =
  'proloco_tunnel_' +
  (process.env.APPLET_ID || 'debd8d027b7e4e39b372')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 24);

function getSocioRelayTopic(tessera: string): string {
  const norm = String(tessera || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return norm ? `${PROLOCO_RELAY_TOPIC}_${norm}` : PROLOCO_RELAY_TOPIC;
}

// Invia l'indirizzo del tunnel a TUTTI gli APK e ai ponti di sincronizzazione ogni volta che il server si connette ad internet
async function broadcastTunnelToAllApksAndRelays(tunnelUrl: string) {
  if (!tunnelUrl) return;
  const cleanUrl = String(tunnelUrl).trim().replace(/\/+$/, '');
  activeTryCloudflareUrl = cleanUrl;
  console.log(`[Tunnel Dispatcher] 🌐 Connessione ad Internet attiva! Invio indirizzo tunnel "${cleanUrl}" a tutti gli APK...`);

  // 1. Salva subito il nuovo indirizzo nel database su disco
  let db: any = {};
  try {
    db = readDbFromDisk() || {};
    db.lastActiveTunnelUrl = cleanUrl;
    db.lastTunnelAnnouncedAt = Date.now();
    db.server_updated_at = Date.now();
    writeDbToDisk(db);
  } catch (err) {
    console.error('[Tunnel Dispatcher] Errore aggiornamento database locale:', err);
  }

  // 2. Trasmetti evento dedicato ad alta priorità 'tunnel_update' via SSE a tutti gli APK connessi in tempo reale
  const tunnelPayload = JSON.stringify({
    type: 'tunnel_update',
    tunnelUrl: cleanUrl,
    publicOrigin: cleanUrl,
    relayTopic: PROLOCO_RELAY_TOPIC,
    updatedAt: Date.now(),
    server_updated_at: Date.now(),
    forceSync: true
  });
  let liveClientsNotified = 0;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(`data: ${tunnelPayload}\n\n`);
      liveClientsNotified++;
    } catch {
      sseClients.splice(i, 1);
    }
  }

  // 3. Trasmetti anche 'db_update' per scatenare immediatamente la sincronizzazione dati bidirezionale
  const dbPayload = JSON.stringify({
    type: 'db_update',
    updatedAt: Date.now(),
    server_updated_at: Date.now(),
    tunnelUrl: cleanUrl,
    forceSync: true
  });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(`data: ${dbPayload}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }

  console.log(`[Tunnel Dispatcher] 📡 Inviato nuovo tunnel a ${liveClientsNotified} APK client connessi in tempo reale (SSE).`);

  // 4. PUBBLICAZIONE SUL CANALE DI RENDEZVOUS PUBBLICO PERMANENTE (ntfy.sh)
  // Consente agli smartphone Android (anche su 4G/5G con vecchio tunnel scaduto) di scoprire il nuovo tunnel istantaneamente!
  if (typeof fetch === 'function') {
    // 4a. Pubblica sul topic generale della Pro Loco
    try {
      fetch(`https://ntfy.sh/${PROLOCO_RELAY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': 'Aggiornamento Tunnel Pro Loco',
          'Tags': 'globe,arrows_counterclockwise',
          'X-Tunnel-Url': cleanUrl
        },
        body: cleanUrl
      }).catch(() => {});
    } catch {}

    // 4b. Pubblica sui canali univoci per ciascun Numero Tessera Socio registrato (come richiesto dall'utente)
    const tessereUniche = new Set<string>();
    if (Array.isArray(db.soci)) {
      for (const s of db.soci) {
        if (s && s.numeroTessera) {
          tessereUniche.add(String(s.numeroTessera).trim().toUpperCase());
        }
      }
    }
    for (const [, dev] of registeredApkClients.entries()) {
      if (dev && dev.numeroTessera) {
        tessereUniche.add(String(dev.numeroTessera).trim().toUpperCase());
      }
    }

    for (const t of tessereUniche) {
      const socioTopic = getSocioRelayTopic(t);
      try {
        fetch(`https://ntfy.sh/${socioTopic}`, {
          method: 'POST',
          headers: {
            'Title': `Nuovo Tunnel Pro Loco per Tessera ${t}`,
            'Tags': 'id_card,satellite',
            'X-Tunnel-Url': cleanUrl,
            'X-Numero-Tessera': t
          },
          body: cleanUrl
        }).catch(() => {});
      } catch {}
    }
  }

  // 5. Notifica eventuali ponti o webhook registrati
  if (typeof fetch === 'function' && PERMANENT_BRIDGE_TRYCLOUDFLARE_URL) {
    const announceEndpoints = [
      `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/v2/tunnel/announce`,
      `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/tunnel/announce`,
      `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/v2/db`
    ];
    for (const ep of announceEndpoints) {
      fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ProLoco-Sync-Hop': '1'
        },
        body: JSON.stringify({
          tunnelUrl: cleanUrl,
          lastActiveTunnelUrl: cleanUrl,
          serverOnline: true,
          announcedAt: Date.now()
        })
      }).catch(() => {});
    }
  }

  for (const [, dev] of registeredApkClients.entries()) {
    if (dev && dev.callbackUrl && typeof fetch === 'function') {
      fetch(dev.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tunnelUrl: cleanUrl,
          numeroTessera: dev.numeroTessera,
          timestamp: Date.now()
        })
      }).catch(() => {});
    }
  }
}

async function startCloudflareQuickTunnel(port: number): Promise<string> {
  if (activeTryCloudflareUrl && !activeTryCloudflareUrl.includes('prostores-email-heat-scientific')) {
    return activeTryCloudflareUrl;
  }
  if (isStartingTunnel) {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (activeTryCloudflareUrl && !activeTryCloudflareUrl.includes('prostores-email-heat-scientific')) {
          clearInterval(interval);
          resolve(activeTryCloudflareUrl);
        } else if (attempts > 40) {
          clearInterval(interval);
          resolve(activeTryCloudflareUrl || PERMANENT_BRIDGE_TRYCLOUDFLARE_URL);
        }
      }, 250);
    });
  }

  isStartingTunnel = true;
  try {
    const cloudflared = await import('cloudflared');
    const binPath = path.join(process.cwd(), 'node_modules/cloudflared/bin/cloudflared');
    if (!fs.existsSync(binPath) && typeof (cloudflared as any).install === 'function') {
      try {
        await (cloudflared as any).install(binPath);
      } catch (e) {
        console.warn('[Cloudflare Quick Tunnel] Installazione automatica binario fallita:', e);
      }
    }
    const { Tunnel } = cloudflared;
    const tunnel = Tunnel.quick(`http://localhost:${port}`, { '--protocol': 'http2' });
    activeTunnelInstance = tunnel;

    return await new Promise<string>((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          isStartingTunnel = false;
          resolve(activeTryCloudflareUrl || PERMANENT_BRIDGE_TRYCLOUDFLARE_URL);
        }
      }, 18000);

      tunnel.on('url', (url: string) => {
        const cleanUrl = String(url || '').trim().replace(/\/+$/, '');
        console.log(`[Cloudflare Quick Tunnel] Operativo su: ${cleanUrl}`);
        isStartingTunnel = false;

        // Distribuisci immediatamente il nuovo indirizzo a tutti gli APK
        broadcastTunnelToAllApksAndRelays(cleanUrl).catch(() => {});

        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(cleanUrl);
        }
      });

      tunnel.on('error', (err: any) => {
        console.error('[Cloudflare Quick Tunnel] Errore:', err?.message || err);
        isStartingTunnel = false;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(activeTryCloudflareUrl || PERMANENT_BRIDGE_TRYCLOUDFLARE_URL);
        }
      });

      tunnel.on('exit', (code: any) => {
        console.warn(`[Cloudflare Quick Tunnel] Processo terminato (code ${code}). Riavvio automatico in 4s...`);
        activeTunnelInstance = null;
        isStartingTunnel = false;
        setTimeout(() => {
          startCloudflareQuickTunnel(port).catch(() => {});
        }, 4000);
      });
    });
  } catch (err) {
    console.error('[Cloudflare Quick Tunnel] Errore avvio:', err);
    isStartingTunnel = false;
    return activeTryCloudflareUrl || PERMANENT_BRIDGE_TRYCLOUDFLARE_URL;
  }
}

// Monitor di Connessione ad Internet: verifica periodicamente e riavvia/invia il tunnel ad ogni ripristino
let isInternetOnline = true;
let internetCheckInterval: any = null;

function checkInternetConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://1.1.1.1', { timeout: 3000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => {
      import('dns').then(dns => {
        dns.lookup('google.com', (err) => {
          resolve(!err);
        });
      }).catch(() => resolve(false));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startInternetAndTunnelWatcher(port: number) {
  if (internetCheckInterval) return;
  internetCheckInterval = setInterval(async () => {
    const online = await checkInternetConnectivity();
    if (online && !isInternetOnline) {
      console.log('[Internet Watcher] 🌐 Connessione ad Internet RILEVATA/RIPRISTINATA sul server!');
      isInternetOnline = true;
      activeTryCloudflareUrl = '';
      const newUrl = await startCloudflareQuickTunnel(port).catch(() => '');
      if (newUrl) {
        broadcastTunnelToAllApksAndRelays(newUrl).catch(() => {});
      }
    } else if (!online && isInternetOnline) {
      console.warn('[Internet Watcher] ⚠️ Connessione ad Internet assente o interrotta.');
      isInternetOnline = false;
    } else if (online && !activeTryCloudflareUrl && !isStartingTunnel) {
      // Internet attivo ma nessun tunnel aperto
      const newUrl = await startCloudflareQuickTunnel(port).catch(() => '');
      if (newUrl) {
        broadcastTunnelToAllApksAndRelays(newUrl).catch(() => {});
      }
    }
  }, 10000);
}

function resolvePublicHostOrigin(req: express.Request): string {
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  if (activeTryCloudflareUrl) {
    return activeTryCloudflareUrl;
  }
  if (host) {
    return `${proto}://${host}`;
  }
  return '';
}

function toBase64UrlNode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Abilita CORS universale per sincronizzazione tra istanza Locale PC (localhost) e Portale Cloud su Linea Dati Mobile
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ProLoco-Sync-Hop');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  const CURRENT_APK_VERSION_CODE = 2;
  const CURRENT_APK_VERSION_NAME = '2.0.0';
  const GESTIONALE_VERSION_NAME = '2.0.0';
  const DEFAULT_APK_VERSION_POLICY = {
    schemaVersion: 2,
    apiVersionsSupported: ['v1', 'v2'],
    currentVersionCode: CURRENT_APK_VERSION_CODE,
    currentVersionName: CURRENT_APK_VERSION_NAME,
    gestionaleVersionName: GESTIONALE_VERSION_NAME,
    minRequiredVersionCode: 1,
    minRequiredVersionName: '1.0.0',
    forceUpdate: false,
    downloadApkUrl: `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/ProLoco.apk`,
    releaseNotes: 'Compatibilità bidirezionale totale tra tutte le versioni di APK e Gestionale.'
  };

  const normalizeTesseraServer = (val: any): string =>
    String(val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  const getActiveVersionPolicy = (db: any) => {
    const custom = (db && db.apkVersionPolicy) || (db && db.config && db.config.apkVersionPolicy) || {};
    return {
      ...DEFAULT_APK_VERSION_POLICY,
      ...custom,
      currentVersionCode: Number(custom.currentVersionCode || CURRENT_APK_VERSION_CODE),
      currentVersionName: String(custom.currentVersionName || CURRENT_APK_VERSION_NAME),
      gestionaleVersionName: String(custom.gestionaleVersionName || GESTIONALE_VERSION_NAME),
      downloadApkUrl: `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/ProLoco.apk`,
      // Regola Tassativa: anche se la versione dell'APK e del Gestionale differiscono (es. APK v1.2 e Gestionale v1.5 o v2.0),
      // i due sistemi dialogano sempre senza generare errori di incompatibilità o blocchi di sistema.
      minRequiredVersionCode: 1,
      minRequiredVersionName: '1.0.0',
      forceUpdate: false
    };
  };

  // Normalizza un'edizione del giornalino garantendo sia i campi v2 che gli alias v1 (tolleranza campi sconosciuti)
  const normalizeEdizioneBidirectional = (raw: any, idx: number = 0) => {
    if (!raw || typeof raw !== 'object') return raw;
    const nested = raw.config && typeof raw.config === 'object' ? raw.config : {};
    const merged = { ...nested, ...raw };
    const testata = merged.testata || merged.titoloTestata || merged.titoloPrincipale || 'Giornalino Pro Loco';
    const sottotitolo = merged.sottotitoloTestata || merged.sottotitolo || '';
    const numeroEdizione = merged.numeroEdizione || (merged.numeroUscita ? `N. ${merged.numeroUscita}` : `N. ${idx + 1}`);
    const periodo = merged.periodo || merged.meseAnno || merged.dataPubblicazione || '';
    const dataPubblicazione = merged.dataPubblicazione || merged.meseAnno || merged.dataUscita || '';
    const totalePagine = Number(merged.totalePagine || merged.numeroPagine || 4);
    const articoliRaw = Array.isArray(merged.articoli) ? merged.articoli : [];
    const articoli = articoliRaw.map((a: any, aIdx: number) => {
      if (!a || typeof a !== 'object') return a;
      const contenuto = a.contenuto !== undefined ? a.contenuto : (a.testo || '');
      const occhiello = a.occhiello || a.categoria || a.sezione || 'Articolo';
      return {
        ...a,
        id: a.id || `art-${idx}-${aIdx}`,
        titolo: a.titolo || 'Articolo',
        contenuto,
        testo: contenuto,
        occhiello,
        categoria: occhiello,
        pagina: Number(a.pagina || 1)
      };
    });
    return {
      ...merged,
      testata,
      titoloTestata: testata,
      titoloPrincipale: testata,
      sottotitoloTestata: sottotitolo,
      sottotitolo,
      numeroEdizione,
      numeroUscita: merged.numeroUscita || idx + 1,
      periodo,
      meseAnno: periodo || dataPubblicazione,
      dataPubblicazione,
      totalePagine,
      numeroPagine: totalePagine,
      articoli
    };
  };

  // Unisce i payload in modo bidirezionale con risoluzione dei conflitti basata su timestamp e tolleranza ai campi sconosciuti
  const mergeDbBidirectional = (existingRaw: any, incomingRaw: any) => {
    const existing = existingRaw && typeof existingRaw === 'object' ? existingRaw : {};
    const incoming = incomingRaw && typeof incomingRaw === 'object' ? incomingRaw : {};

    // Supporto alias di versioni precedenti (configurazione -> config, giornalino -> giornalinoConfig)
    const incomingConfig = incoming.config || incoming.configurazione;
    const incomingGiornalino = incoming.giornalinoConfig || incoming.giornalino;

    // 1. Risoluzione conflitti Soci (preserva modifiche fatte da APK se apkUpdatedAt > gestionaleUpdatedAt e preserva campi sconosciuti)
    let mergedSoci = existing.soci;
    if (Array.isArray(incoming.soci)) {
      const existingSociMap = new Map<string, any>();
      if (Array.isArray(existing.soci)) {
        for (const s of existing.soci) {
          if (s && typeof s === 'object') {
            const key = normalizeTesseraServer(s.numeroTessera) || String(s.id || '');
            if (key) existingSociMap.set(key, s);
          }
        }
      }
      mergedSoci = incoming.soci.map((incSocio: any) => {
        if (!incSocio || typeof incSocio !== 'object') return incSocio;
        const key = normalizeTesseraServer(incSocio.numeroTessera) || String(incSocio.id || '');
        const prevSocio = key ? existingSociMap.get(key) : null;
        if (!prevSocio) return incSocio;

        const prevApkTs = Number(prevSocio.apkUpdatedAt || 0);
        const incApkTs = Number(incSocio.apkUpdatedAt || 0);
        const incAdminTs = Number(incSocio.gestionaleUpdatedAt || 0);

        // Se l'APK aveva salvato recapiti più recenti che il gestionale non ha ancora recepito, li preserva
        const keepApkContacts = prevApkTs > incApkTs && prevApkTs > incAdminTs;
        return {
          ...prevSocio,
          ...incSocio,
          telefono: keepApkContacts ? (prevSocio.telefono ?? incSocio.telefono) : incSocio.telefono,
          email: keepApkContacts ? (prevSocio.email ?? incSocio.email) : incSocio.email,
          indirizzo: keepApkContacts ? (prevSocio.indirizzo ?? incSocio.indirizzo) : incSocio.indirizzo,
          apkUpdatedAt: Math.max(prevApkTs, incApkTs)
        };
      });
    }

    // 2. Risoluzione conflitti Eventi e Iscrizioni (unisce le iscrizioni inviate dall'APK offline senza sovrascriverle)
    let mergedEventi = existing.eventi;
    if (Array.isArray(incoming.eventi)) {
      const existingEventiMap = new Map<string, any>();
      if (Array.isArray(existing.eventi)) {
        for (const ev of existing.eventi) {
          if (ev && ev.id) existingEventiMap.set(String(ev.id), ev);
        }
      }
      mergedEventi = incoming.eventi.map((incEv: any) => {
        if (!incEv || typeof incEv !== 'object') return incEv;
        const prevEv = incEv.id ? existingEventiMap.get(String(incEv.id)) : null;
        if (!prevEv) return incEv;

        const incIscr = Array.isArray(incEv.iscrizioni) ? incEv.iscrizioni : [];
        const prevIscr = Array.isArray(prevEv.iscrizioni) ? prevEv.iscrizioni : [];
        const combinedIscr = [...incIscr];
        for (const oldI of prevIscr) {
          if (!oldI || typeof oldI !== 'object') continue;
          const isApkOrigin = String(oldI.id || '').startsWith('iscr-apk-') || Boolean(oldI.fromApk);
          if (isApkOrigin) {
            const alreadyPresent = combinedIscr.some((curI: any) =>
              curI.id === oldI.id ||
              (curI.socioId && oldI.socioId && curI.socioId === oldI.socioId) ||
              (curI.socioTessera && oldI.socioTessera && normalizeTesseraServer(curI.socioTessera) === normalizeTesseraServer(oldI.socioTessera))
            );
            if (!alreadyPresent) {
              combinedIscr.push(oldI);
            }
          }
        }
        return {
          ...prevEv,
          ...incEv,
          iscrizioni: combinedIscr
        };
      });
    }

    // 3. Normalizzazione Archivio Giornalini (compatibilità v1 + v2)
    let mergedArchivio = existing.archivioGiornalini;
    if (Array.isArray(incoming.archivioGiornalini)) {
      mergedArchivio = incoming.archivioGiornalini.map((ed: any, idx: number) =>
        normalizeEdizioneBidirectional(ed, idx)
      );
    } else if (Array.isArray(existing.archivioGiornalini)) {
      mergedArchivio = existing.archivioGiornalini.map((ed: any, idx: number) =>
        normalizeEdizioneBidirectional(ed, idx)
      );
    }

    const mergedConfig = incomingConfig
      ? { ...(existing.config || {}), ...incomingConfig }
      : existing.config;

    const mergedGiornalinoConfig = incomingGiornalino
      ? normalizeEdizioneBidirectional({ ...(existing.giornalinoConfig || {}), ...incomingGiornalino }, 0)
      : existing.giornalinoConfig;

    const mergedVersionPolicy = incoming.apkVersionPolicy
      ? { ...getActiveVersionPolicy(existing), ...incoming.apkVersionPolicy }
      : getActiveVersionPolicy(existing);

    const resolvedTunnelUrl =
      activeTryCloudflareUrl ||
      incoming.lastActiveTunnelUrl ||
      existing.lastActiveTunnelUrl ||
      '';

    const nowTs = Date.now();
    return {
      ...existing,
      ...incoming,
      schemaVersion: 2,
      ...(mergedConfig ? { config: mergedConfig, configurazione: mergedConfig } : {}),
      ...(mergedSoci ? { soci: mergedSoci } : {}),
      ...(mergedEventi ? { eventi: mergedEventi } : {}),
      ...(mergedArchivio ? { archivioGiornalini: mergedArchivio } : {}),
      ...(mergedGiornalinoConfig ? { giornalinoConfig: mergedGiornalinoConfig, giornalino: mergedGiornalinoConfig } : {}),
      ...(resolvedTunnelUrl ? { lastActiveTunnelUrl: resolvedTunnelUrl } : {}),
      apkVersionPolicy: mergedVersionPolicy,
      updatedAt: nowTs,
      server_updated_at: nowTs
    };
  };

  // API: Canale Real-Time Server-Sent Events (/api/stream, /api/v1/stream, /api/v2/stream) per notifica istantanea agli APK e Portali Soci
  app.get(['/api/stream', '/api/v1/stream', '/api/v2/stream'], (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    const rawT = String(req.query.tessera || req.query.s || req.headers['x-proloco-tessera'] || '').trim().toUpperCase();
    const vCode = Number(req.query.versionCode || req.query.v || 1);
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sseClients.push({
      id: clientId,
      res,
      clientInfo: {
        numeroTessera: rawT || undefined,
        versionCode: vCode,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    });
    if (rawT) {
      registeredApkClients.set(rawT, {
        numeroTessera: rawT,
        versionCode: vCode,
        lastSeenAt: Date.now(),
        ip: req.ip
      });
    }

    const currentDb = readDbFromDisk();
    const serverTs = currentDb?.server_updated_at || currentDb?.updatedAt || Date.now();
    const initPayload = JSON.stringify({
      type: 'connected',
      updatedAt: serverTs,
      server_updated_at: serverTs,
      tunnelUrl: activeTryCloudflareUrl || null,
      forceSync: false
    });
    res.write(`data: ${initPayload}\n\n`);

    const keepAliveTimer = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        clearInterval(keepAliveTimer);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAliveTimer);
      const idx = sseClients.findIndex(c => c.id === clientId);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // API: Stato e generazione del Link Pubblico Portale Soci (supporta /api/tunnel, /api/v1/tunnel, /api/v2/tunnel)
  app.get(['/api/tunnel', '/api/v1/tunnel', '/api/v2/tunnel'], async (req, res) => {
    if (!activeTryCloudflareUrl) {
      await startCloudflareQuickTunnel(PORT).catch(() => {});
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      apiVersion: req.path.includes('/v2/') ? 'v2' : req.path.includes('/v1/') ? 'v1' : 'v2',
      tunnelUrl: activeTryCloudflareUrl || null,
      starting: isStartingTunnel,
      publicOrigin: activeTryCloudflareUrl || resolvePublicHostOrigin(req)
    });
  });

  app.post(['/api/tunnel/restart', '/api/v1/tunnel/restart', '/api/v2/tunnel/restart'], async (req, res) => {
    try {
      if (activeTunnelInstance && typeof activeTunnelInstance.stop === 'function') {
        activeTunnelInstance.stop();
      }
    } catch {
      // ignore
    }
    activeTryCloudflareUrl = '';
    activeTunnelInstance = null;
    const url = await startCloudflareQuickTunnel(PORT);
    res.json({
      ok: true,
      tunnelUrl: url || null,
      publicOrigin: url || resolvePublicHostOrigin(req)
    });
  });

  // API: Ricezione annuncio tunnel da nodi remoti o bridge
  app.post(['/api/tunnel/announce', '/api/v1/tunnel/announce', '/api/v2/tunnel/announce'], (req, res) => {
    const incoming = req.body || {};
    const url = String(incoming.tunnelUrl || incoming.url || '').trim().replace(/\/+$/, '');
    if (url && url.includes('.trycloudflare.com') && !url.includes('prostores-email-heat-scientific')) {
      activeTryCloudflareUrl = url;
      try {
        const db = readDbFromDisk() || {};
        db.lastActiveTunnelUrl = url;
        db.lastTunnelAnnouncedAt = Date.now();
        writeDbToDisk(db);
        broadcastTunnelToAllApksAndRelays(url).catch(() => {});
      } catch {}
    }
    res.json({ ok: true, tunnelUrl: activeTryCloudflareUrl || null });
  });

  // API: Forza il broadcast immediato dell'indirizzo tunnel a tutti i canali univoci e al relay pubblico permanente
  app.post(['/api/tunnel/broadcast', '/api/v1/tunnel/broadcast', '/api/v2/tunnel/broadcast'], async (req, res) => {
    const incoming = req.body || {};
    const url = String(incoming.tunnelUrl || incoming.url || activeTryCloudflareUrl || '').trim().replace(/\/+$/, '');
    if (url) {
      await broadcastTunnelToAllApksAndRelays(url).catch(() => {});
    }
    res.json({
      ok: true,
      broadcasted: true,
      tunnelUrl: url || activeTryCloudflareUrl || null,
      relayTopic: PROLOCO_RELAY_TOPIC
    });
  });

  // API: Registrazione dispositivi APK per tracciamento sincronizzazione automatica
  app.post(['/api/apk/register', '/api/v1/apk/register', '/api/v2/apk/register'], (req, res) => {
    const payload = req.body || {};
    const rawT = String(payload.numeroTessera || payload.tessera || '').trim().toUpperCase();
    const devId = String(payload.deviceId || payload.id || rawT || req.ip || Math.random().toString(36).slice(2)).trim();
    registeredApkClients.set(devId, {
      numeroTessera: rawT,
      versionCode: Number(payload.versionCode || 1),
      lastSeenAt: Date.now(),
      ip: req.ip,
      callbackUrl: payload.callbackUrl ? String(payload.callbackUrl) : undefined
    });
    console.log(`[APK Registry] Registrato APK dispositivo per socio ${rawT || 'Anonimo'} (Totale registrati: ${registeredApkClients.size})`);
    res.json({
      ok: true,
      registered: true,
      tunnelUrl: activeTryCloudflareUrl || null,
      serverTimestamp: Date.now()
    });
  });

  // API: Controllo e Gestione Versione APK (/api/version, /api/v1/version, /api/v2/version) - Sempre compatibile senza blocchi
  app.get(['/api/version', '/api/v1/version', '/api/v2/version'], (req, res) => {
    const db = readDbFromDisk() || {};
    const policy = getActiveVersionPolicy(db);
    const clientCode = Number(req.query.versionCode || req.query.v || CURRENT_APK_VERSION_CODE);
    const tessera = String(req.query.tessera || req.query.s || '').trim().toUpperCase();
    const hostOrigin = resolvePublicHostOrigin(req);
    const updateRequired = false;
    const updateAvailable = clientCode < policy.currentVersionCode;
    const nowTs = Date.now();

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      apiVersion: req.path.includes('/v1/') ? 'v1' : 'v2',
      schemaVersion: 2,
      versionPolicy: policy,
      clientVersionCode: clientCode,
      updateRequired,
      updateAvailable,
      downloadApkUrl: tessera ? `${hostOrigin}/apk/${encodeURIComponent(tessera)}.apk` : `${hostOrigin}/api/apk/download`,
      installPageUrl: tessera ? `${hostOrigin}/inst/${encodeURIComponent(tessera)}` : `${hostOrigin}/`,
      serverTimestamp: nowTs,
      server_updated_at: db.server_updated_at || db.updatedAt || nowTs,
      tunnelUrl: activeTryCloudflareUrl || db.lastActiveTunnelUrl || null
    });
  });

  app.post(['/api/version', '/api/v1/version', '/api/v2/version'], (req, res) => {
    const existing = readDbFromDisk() || {};
    const incomingPolicy = req.body || {};
    const newPolicy = {
      ...getActiveVersionPolicy(existing),
      ...incomingPolicy,
      updatedAt: Date.now()
    };
    const merged = mergeDbBidirectional(existing, { apkVersionPolicy: newPolicy });
    writeDbToDisk(merged);
    broadcastServerDbUpdate(merged);
    res.json({ ok: true, versionPolicy: newPolicy, updatedAt: merged.updatedAt, server_updated_at: merged.server_updated_at });
  });

  // API: Sincronizzazione Bidirezionale Dedicata APK <-> Gestionale (/api/socio-sync, /api/v1/socio-sync, /api/v2/socio-sync)
  const handleSocioSyncRequest = (req: express.Request, res: express.Response) => {
    const db = readDbFromDisk() || {};
    const payload = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const rawTessera = String(payload.numeroTessera || payload.tessera || payload.s || (payload.socioUpdate && payload.socioUpdate.numeroTessera) || '').trim();
    const normT = normalizeTesseraServer(rawTessera);
    const clientVersionCode = Number(payload.clientVersionCode || payload.versionCode || 1);
    const sinceTs = Number(payload.since_ts || payload.lastSyncServerTimestamp || req.query.since_ts || 0);

    let dbModified = false;
    const conflictsResolved: string[] = [];

    // 1. Applica aggiornamenti Anagrafica inviati dall'APK (is_dirty / last_updated) in modo idempotente con risoluzione conflitti basata su timestamp
    if (payload.socioUpdate && typeof payload.socioUpdate === 'object' && Array.isArray(db.soci)) {
      const upd = payload.socioUpdate;
      const targetNorm = normalizeTesseraServer(upd.numeroTessera || rawTessera);
      const updTs = Number(upd.last_updated || upd.updatedAt || Date.now());

      db.soci = db.soci.map((s: any) => {
        if (!s || normalizeTesseraServer(s.numeroTessera) !== targetNorm) return s;
        const serverAdminTs = Number(s.gestionaleUpdatedAt || 0);
        const prevApkTs = Number(s.apkUpdatedAt || 0);

        // Idempotenza: se la stessa richiesta viene inviata più volte (es. interruzione durante il reboot), non duplica scritture su disco se già applicata
        const isIdenticalAlreadyApplied =
          prevApkTs === updTs &&
          (upd.telefono === undefined || String(s.telefono || '') === String(upd.telefono || '')) &&
          (upd.email === undefined || String(s.email || '') === String(upd.email || '')) &&
          (upd.indirizzo === undefined || String(s.indirizzo || '') === String(upd.indirizzo || ''));

        if (isIdenticalAlreadyApplied) {
          conflictsResolved.push(`socio:${s.numeroTessera}:idempotent_already_applied`);
          return s;
        }

        if (updTs >= serverAdminTs && updTs >= prevApkTs) {
          dbModified = true;
          conflictsResolved.push(`socio:${s.numeroTessera}:client_wins`);
          return {
            ...s,
            ...(upd.extraFields && typeof upd.extraFields === 'object' ? upd.extraFields : {}),
            telefono: upd.telefono !== undefined ? String(upd.telefono) : s.telefono,
            email: upd.email !== undefined ? String(upd.email) : s.email,
            indirizzo: upd.indirizzo !== undefined ? String(upd.indirizzo) : s.indirizzo,
            apkUpdatedAt: updTs,
            server_updated_at: Date.now()
          };
        } else {
          conflictsResolved.push(`socio:${s.numeroTessera}:server_wins`);
          return s;
        }
      });
    }

    // 2. Applica iscrizioni agli Eventi accodate in modalità offline dall'APK (idempotente per id / socioId / socioTessera)
    if (Array.isArray(payload.iscrizioniEventi) && payload.iscrizioniEventi.length > 0 && Array.isArray(db.eventi)) {
      for (const item of payload.iscrizioniEventi) {
        if (!item || !item.eventoId || !item.iscrizione) continue;
        for (let i = 0; i < db.eventi.length; i++) {
          const ev = db.eventi[i];
          if (ev && String(ev.id) === String(item.eventoId)) {
            if (!Array.isArray(ev.iscrizioni)) ev.iscrizioni = [];
            const exists = ev.iscrizioni.some((x: any) =>
              x.id === item.iscrizione.id ||
              (x.socioId && item.iscrizione.socioId && x.socioId === item.iscrizione.socioId) ||
              (x.socioTessera && item.iscrizione.socioTessera && normalizeTesseraServer(x.socioTessera) === normalizeTesseraServer(item.iscrizione.socioTessera))
            );
            if (!exists) {
              const nowSyncTs = Date.now();
              ev.iscrizioni.push({
                ...item.iscrizione,
                fromApk: true,
                syncedAt: nowSyncTs,
                server_updated_at: nowSyncTs
              });
              ev.server_updated_at = nowSyncTs;
              dbModified = true;
              conflictsResolved.push(`evento:${ev.id}:iscrizione_merged`);
            } else {
              conflictsResolved.push(`evento:${ev.id}:idempotent_already_applied`);
            }
          }
        }
      }
    }

    const normalizedDb = mergeDbBidirectional(db, dbModified ? { soci: db.soci, eventi: db.eventi } : {});
    if (dbModified) {
      writeDbToDisk(normalizedDb);
      broadcastServerDbUpdate(normalizedDb);
      // Propaga anche al ponte permanente Cloudflare
      const isSyncHop = Boolean(req.headers['x-proloco-sync-hop']);
      const hostHeader = String(req.get('host') || '').toLowerCase();
      if (!isSyncHop && !hostHeader.includes('prostores-email-heat-scientific') && typeof fetch === 'function') {
        fetch(`${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/v2/db`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-ProLoco-Sync-Hop': '1' },
          body: JSON.stringify(normalizedDb)
        }).catch(() => {});
      }
    }

    const socioAggiornato = normT && Array.isArray(normalizedDb.soci)
      ? normalizedDb.soci.find((s: any) => normalizeTesseraServer(s.numeroTessera) === normT) || null
      : null;

    const comunicazioniSocio = Array.isArray(normalizedDb.comunicazioni)
      ? normalizedDb.comunicazioni.filter((c: any) => {
          if (!c.numeroTesseraRiferimento || c.numeroTesseraRiferimento === 'TUTTI') return true;
          if (!normT) return true;
          return normalizeTesseraServer(c.numeroTesseraRiferimento) === normT;
        })
      : [];

    const policy = getActiveVersionPolicy(normalizedDb);
    const hostOrigin = resolvePublicHostOrigin(req);
    const effectiveTunnelUrl = activeTryCloudflareUrl || normalizedDb.lastActiveTunnelUrl || null;
    const updateRequired = false;
    const serverUpdatedAt = Number(normalizedDb.server_updated_at || normalizedDb.updatedAt || Date.now());
    const hasNewServerChanges = sinceTs === 0 || serverUpdatedAt > sinceTs || dbModified;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      apiVersion: req.path.includes('/v1/') ? 'v1' : 'v2',
      schemaVersion: 2,
      serverTimestamp: serverUpdatedAt,
      server_updated_at: serverUpdatedAt,
      has_changes_since_last_sync: hasNewServerChanges,
      versionPolicy: policy,
      updateRequired,
      updateAvailable: clientVersionCode < policy.currentVersionCode,
      downloadApkUrl: rawTessera
        ? `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/${encodeURIComponent(rawTessera)}.apk`
        : `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/ProLoco.apk`,
      conflictsResolved,
      socio: socioAggiornato,
      config: normalizedDb.config || null,
      comunicazioni: comunicazioniSocio,
      eventi: Array.isArray(normalizedDb.eventi) ? normalizedDb.eventi.filter((e: any) => e.stato !== 'annullato') : [],
      archivioGiornalini: Array.isArray(normalizedDb.archivioGiornalini) ? normalizedDb.archivioGiornalini : [],
      db: normalizedDb,
      tunnelUrl: effectiveTunnelUrl,
      publicOrigin: effectiveTunnelUrl || hostOrigin
    });
  };

  app.get(['/api/socio-sync', '/api/v1/socio-sync', '/api/v2/socio-sync'], handleSocioSyncRequest);
  app.post(['/api/socio-sync', '/api/v1/socio-sync', '/api/v2/socio-sync'], handleSocioSyncRequest);

  // API: Leggi intero stato del database sincronizzato (supporta /api/db, /api/v1/db, /api/v2/db) con supporto server_updated_at / since_ts
  app.get(['/api/db', '/api/v1/db', '/api/v2/db'], (req, res) => {
    const rawDb = readDbFromDisk();
    const db = rawDb ? mergeDbBidirectional(rawDb, {}) : rawDb;
    const policy = getActiveVersionPolicy(db || {});
    const effectiveTunnelUrl = activeTryCloudflareUrl || (db && db.lastActiveTunnelUrl) || null;
    const sinceTs = Number(req.query.since_ts || req.query.last_sync_ts || 0);
    const serverUpdatedAt = Number((db && (db.server_updated_at || db.updatedAt)) || Date.now());
    const hasNewServerChanges = sinceTs === 0 || serverUpdatedAt > sinceTs;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      apiVersion: req.path.includes('/v1/') ? 'v1' : 'v2',
      schemaVersion: 2,
      versionPolicy: policy,
      server_updated_at: serverUpdatedAt,
      updatedAt: serverUpdatedAt,
      has_changes_since_last_sync: hasNewServerChanges,
      db,
      tunnelUrl: effectiveTunnelUrl,
      publicOrigin: effectiveTunnelUrl || resolvePublicHostOrigin(req)
    });
  });

  // API: Salva / aggiorna stato del database (parziale o completo) con risoluzione conflitti bidirezionale e idempotenza
  app.post(['/api/db', '/api/v1/db', '/api/v2/db'], (req, res) => {
    const incoming = req.body || {};
    const existing = readDbFromDisk() || {};
    const merged = mergeDbBidirectional(existing, incoming);
    writeDbToDisk(merged);
    broadcastServerDbUpdate(merged);

    // Se la modifica avviene localmente o su dev, propaga sempre al ponte Cloudflare permanente
    const isSyncHop = Boolean(req.headers['x-proloco-sync-hop']);
    const hostHeader = String(req.get('host') || '').toLowerCase();
    if (!isSyncHop && !hostHeader.includes('prostores-email-heat-scientific') && typeof fetch === 'function') {
      fetch(`${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/v2/db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ProLoco-Sync-Hop': '1'
        },
        body: JSON.stringify(merged)
      }).catch(() => {
        // Ignora se il server è momentaneamente offline
      });
    }

    res.json({
      ok: true,
      apiVersion: req.path.includes('/v1/') ? 'v1' : 'v2',
      schemaVersion: 2,
      versionPolicy: getActiveVersionPolicy(merged),
      updatedAt: merged.updatedAt,
      server_updated_at: merged.server_updated_at,
      tunnelUrl: activeTryCloudflareUrl || null
    });
  });

  // API: Azzera completamente il database sul server (supporta /api/db/reset, /api/v1/db/reset, /api/v2/db/reset)
  app.post(['/api/db/reset', '/api/v1/db/reset', '/api/v2/db/reset'], (req, res) => {
    const incoming = req.body || {};
    const resetState = {
      azzerato: true,
      schemaVersion: 2,
      soci: [],
      eventi: [],
      donazioni: [],
      campagne: [],
      cestino: [],
      comunicazioni: [],
      archivioGiornalini: [],
      giornalinoAttivoId: '',
      apkVersionPolicy: DEFAULT_APK_VERSION_POLICY,
      ...(incoming.config ? { config: incoming.config } : {}),
      ...(incoming.sitoConfig ? { sitoConfig: incoming.sitoConfig } : {}),
      ...(incoming.giornalinoConfig ? { giornalinoConfig: incoming.giornalinoConfig } : {}),
      updatedAt: Date.now()
    };
    writeDbToDisk(resetState);
    broadcastServerDbUpdate(resetState);

    const isSyncHop = Boolean(req.headers['x-proloco-sync-hop']);
    const hostHeader = String(req.get('host') || '').toLowerCase();
    if (!isSyncHop && !hostHeader.includes('prostores-email-heat-scientific') && typeof fetch === 'function') {
      fetch(`${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/api/db/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ProLoco-Sync-Hop': '1'
        },
        body: JSON.stringify(incoming)
      }).catch(() => {
        // ignore
      });
    }

    res.json({ ok: true, db: resetState });
  });

  // Funzione condivisa per generare e servire un vero file .APK Android firmato (V1 + V2) o archivio .ZIP per email
  const serveApkPackage = async (req: express.Request, res: express.Response, rawTessera?: string) => {
    try {
      if (!activeTryCloudflareUrl) {
        await startCloudflareQuickTunnel(PORT).catch(() => {});
      }
      const db = readDbFromDisk() || {};
      const isZipRequested = /\.zip$/i.test(String(rawTessera || '')) || req.query.format === 'zip';
      const cleanedParam = String(rawTessera || req.query.tessera || req.query.s || '')
        .replace(/\.(apk|zip|apk\.zip)$/i, '')
        .replace(/^socio[_-]/i, '')
        .trim()
        .toUpperCase();
      const tessera = cleanedParam === 'APP' || cleanedParam === 'PROLOCO' ? '' : cleanedParam;

      const normalizeCode = (val: string) => String(val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const targetNorm = normalizeCode(tessera);

      const socioDb =
        targetNorm && Array.isArray(db.soci)
          ? db.soci.find((s: any) => normalizeCode(s.numeroTessera) === targetNorm)
          : null;

      const tesseraUfficiale = socioDb?.numeroTessera
        ? String(socioDb.numeroTessera).trim().toUpperCase()
        : tessera;

      const nomeParam = String(req.query.n || '').trim();
      const cognomeParam = String(req.query.c || '').trim();
      const nomeCompletoParam = `${nomeParam} ${cognomeParam}`.trim();

      const nomeSocio = String(
        req.query.nome ||
          nomeCompletoParam ||
          (socioDb ? `${socioDb.nome || ''} ${socioDb.cognome || ''}`.trim() : '') ||
          (tesseraUfficiale ? `Socio ${tesseraUfficiale}` : 'Socio Pro Loco')
      ).trim();

      const nomeProLoco = String(
        req.query.proloco || (db.config && db.config.nome) || 'Pro Loco'
      ).trim();

      const pinSocio = String(
        req.query.pin || req.query.p || (socioDb && socioDb.pin) || '1234'
      ).trim();

      const hostOrigin = resolvePublicHostOrigin(req);
      const pinToken = toBase64UrlNode(pinSocio);
      const extraSocioParams = [
        `pk=${encodeURIComponent(pinToken)}`,
        nomeParam || socioDb?.nome ? `n=${encodeURIComponent(nomeParam || socioDb?.nome || '')}` : '',
        cognomeParam || socioDb?.cognome ? `c=${encodeURIComponent(cognomeParam || socioDb?.cognome || '')}` : ''
      ]
        .filter(Boolean)
        .join('&');

      const defaultSocioUrl = tesseraUfficiale
        ? `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/?s=${encodeURIComponent(tesseraUfficiale)}&pin=${encodeURIComponent(pinSocio)}${extraSocioParams ? `&${extraSocioParams}` : ''}`
        : `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/`;
      const targetUrl = String(req.query.url || defaultSocioUrl).trim();

      const safePkgSuffix = tesseraUfficiale.toLowerCase().replace(/[^a-z0-9]/g, '');
      const packageId = safePkgSuffix
        ? `it.proloco.app.t${safePkgSuffix}`
        : 'it.proloco.app';
      const appLabel = tesseraUfficiale
        ? `ProLoco Socio ${tesseraUfficiale}`
        : `${nomeProLoco}`;

      const annoCorrenteApk = new Date().getFullYear();
      const comunicazioniPerSocioApk = Array.isArray(db.comunicazioni)
        ? db.comunicazioni.filter((c: any) => {
            if (!c.numeroTesseraRiferimento || c.numeroTesseraRiferimento === 'TUTTI') return true;
            if (!tesseraUfficiale) return true;
            return normalizeCode(c.numeroTesseraRiferimento) === normalizeCode(tesseraUfficiale);
          })
        : [];

      const initialOfflineSnapshot = {
        proLoco: nomeProLoco,
        config: db.config || {
          nome: nomeProLoco,
          comune: '',
          provincia: '',
          codiceFiscale: '',
          telefono: '',
          email: '',
          quotaStandardOrdinario: 15
        },
        anno: annoCorrenteApk,
        socio: socioDb || {
          id: tesseraUfficiale ? `socio-apk-${tesseraUfficiale}` : 'socio-apk',
          numeroTessera: tesseraUfficiale || 'PL-2026-001',
          pin: pinSocio,
          nome: nomeParam || (nomeSocio.split(' ')[0] || 'Socio'),
          cognome: cognomeParam || (nomeSocio.split(' ').slice(1).join(' ') || tesseraUfficiale),
          codiceFiscale: String(req.query.cf || '').trim().toUpperCase(),
          telefono: '',
          email: '',
          indirizzo: '',
          citta: (db.config && db.config.comune) || '',
          cap: (db.config && db.config.cap) || '',
          provincia: (db.config && db.config.provincia) || '',
          categoria: 'Ordinario',
          ruoloDirettivo: 'Nessuno',
          dataIscrizione: `${annoCorrenteApk}-01-01`,
          attivo: true,
          consensoPrivacy: true,
          quote: [
            {
              id: `q-apk-${annoCorrenteApk}`,
              anno: annoCorrenteApk,
              importo: (db.config && db.config.quotaStandardOrdinario) || 15,
              dataPagamento: new Date().toISOString().slice(0, 10),
              dataScadenza: `${annoCorrenteApk}-12-31`,
              metodo: 'Contanti',
              ricevutaNumero: `REC-${annoCorrenteApk}/001`
            }
          ]
        },
        comunicazioni: comunicazioniPerSocioApk,
        eventi: Array.isArray(db.eventi) ? db.eventi.filter((e: any) => e.stato !== 'annullato') : [],
        archivioGiornalini: Array.isArray(db.archivioGiornalini) ? db.archivioGiornalini : [],
        endpoints: Array.from(
          new Set(
            [
              activeTryCloudflareUrl,
              db.lastActiveTunnelUrl,
              hostOrigin,
              ...getLocalLanIps().map(ip => `http://${ip}:${PORT}`),
              PERMANENT_BRIDGE_TRYCLOUDFLARE_URL,
              PUBLIC_CLOUD_PORTAL_ORIGIN,
              PUBLIC_CLOUD_PORTAL_ORIGIN ? PUBLIC_CLOUD_PORTAL_ORIGIN.replace('://ais-pre-', '://ais-dev-') : ''
            ].filter(Boolean)
          )
        ),
        relayTopic: PROLOCO_RELAY_TOPIC,
        socioRelayTopic: getSocioRelayTopic(tesseraUfficiale),
        socioRelayUrl: `https://ntfy.sh/${getSocioRelayTopic(tesseraUfficiale)}`,
        globalRelayUrl: `https://ntfy.sh/${PROLOCO_RELAY_TOPIC}`,
        portalTargetUrl: targetUrl,
        updatedAt: Date.now()
      };

      const safeEmbeddedJson = JSON.stringify(initialOfflineSnapshot).replace(/<\//g, '<\\/');

      const standaloneLauncherHtml = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${appLabel}</title>
  <meta name="theme-color" content="#065f46" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #f6f4ee; color: #1c1917; min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { background: #064e3b; color: #ffffff; padding: 14px 16px; position: sticky; top: 0; z-index: 40; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
    .topbar-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; max-width: 720px; margin: 0 auto; }
    .brand-title { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
    .brand-sub { font-size: 11px; color: #a7f3d0; font-weight: 600; }
    .topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .version-badge-top { display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 800; font-family: monospace; background: rgba(16,185,129,0.28); color: #ffffff; border: 1px solid rgba(167,243,208,0.55); letter-spacing: 0.02em; white-space: nowrap; }
    .sync-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: rgba(255,255,255,0.14); color: #ecfdf5; border: 1px solid rgba(255,255,255,0.22); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #fbbf24; }
    .dot.online { background: #34d399; box-shadow: 0 0 8px #34d399; }
    .tabs { background: #ffffff; border-bottom: 1px solid #e7e5e4; display: flex; overflow-x: auto; gap: 4px; padding: 6px 10px 0; position: sticky; top: 58px; z-index: 30; }
    .tab-btn { border: none; background: transparent; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #57534e; border-bottom: 2.5px solid transparent; cursor: pointer; white-space: nowrap; border-radius: 8px 8px 0 0; }
    .tab-btn.active { color: #065f46; border-bottom-color: #059669; background: #ecfdf5; font-weight: 800; }
    .container { max-width: 720px; width: 100%; margin: 0 auto; padding: 16px; flex: 1; }
    .banner-evergreen { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px 14px; border-radius: 14px; font-size: 11.5px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .card-tessera { background: linear-gradient(135deg, #064e3b 0%, #115e59 55%, #0f172a 100%); color: #ffffff; border-radius: 22px; padding: 20px; box-shadow: 0 14px 28px rgba(6,78,59,0.25); margin-bottom: 16px; position: relative; overflow: hidden; border: 1px solid rgba(16,185,129,0.35); }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 18px; }
    .unpli-tag { background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #a7f3d0; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
    .socio-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #6ee7b7; font-weight: 700; }
    .socio-name { font-size: 21px; font-weight: 900; margin: 2px 0 4px; color: #ffffff; }
    .socio-cf { font-family: monospace; font-size: 12px; color: #d1fae5; }
    .card-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.16); }
    .tessera-num { font-family: monospace; font-size: 16px; font-weight: 900; color: #ffffff; letter-spacing: 0.04em; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #10b981; color: #064e3b; }
    .box { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
    .box-title { font-size: 14px; font-weight: 800; color: #1c1917; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 520px) { .field-grid { grid-template-columns: 1fr; } }
    .field { background: #fafaf9; border: 1px solid #e7e5e4; padding: 10px 12px; border-radius: 12px; }
    .field-lbl { font-size: 10px; font-weight: 700; color: #78716c; text-transform: uppercase; display: block; margin-bottom: 2px; }
    .field-val { font-size: 13px; font-weight: 700; color: #1c1917; word-break: break-word; }
    .input { width: 100%; padding: 9px 11px; border: 1px solid #d6d3d1; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 4px; background: #ffffff; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #059669; color: #ffffff; border: none; padding: 10px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; text-decoration: none; }
    .btn-secondary { background: #f5f5f4; color: #1c1917; border: 1px solid #d6d3d1; }
    .btn-indigo { background: #312e81; color: #ffffff; }
    .com-item { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 14px; margin-bottom: 10px; }
    .com-item.giornalino { border-color: #a5b4fc; background: #eef2ff; }
    .com-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
    .tag { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; background: #e7e5e4; color: #44403c; }
    .tag.giornalino { background: #312e81; color: #ffffff; }
    .tag.tessera { background: #d1fae5; color: #065f46; font-family: monospace; }
    .com-title { font-size: 14px; font-weight: 800; color: #1c1917; margin-bottom: 4px; }
    .com-body { font-size: 12px; color: #44403c; white-space: pre-line; line-height: 1.45; background: #fafaf9; padding: 10px; border-radius: 10px; border: 1px solid #e7e5e4; margin-top: 6px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.75); z-index: 100; display: none; align-items: center; justify-content: center; padding: 14px; }
    .modal-box { background: #ffffff; max-width: 660px; width: 100%; max-height: 90vh; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; }
    .modal-head { background: #1e1b4b; color: #ffffff; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 16px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.5; }
    .login-gate { position: fixed; inset: 0; background: #f6f4ee; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 18px; }
    .login-card { background: #ffffff; max-width: 400px; width: 100%; border-radius: 24px; padding: 24px 20px; border: 1px solid #e7e5e4; box-shadow: 0 12px 32px rgba(0,0,0,0.08); text-align: center; }
  </style>
</head>
<body>
  <!-- BLOCCO SBLOCCO PIN INIZIALE (FUNZIONA ANCHE A SERVER SPENTO) -->
  <div id="loginGate" class="login-gate" style="display:none;">
    <div class="login-card">
      <img src="file:///android_asset/icon.png" onerror="this.onerror=null;this.src='/icon.svg';" alt="Logo Pro Loco" style="width:68px;height:68px;border-radius:18px;margin:0 auto 12px;display:block;box-shadow:0 6px 16px rgba(6,78,59,0.25);" />
      <h2 style="font-size:19px;font-weight:900;color:#1c1917;margin-bottom:4px;">Area Riservata Socio</h2>
      <p style="font-size:12px;color:#57534e;margin-bottom:16px;">Funzionante anche a server spento. Inserisci Numero Tessera e PIN personale.</p>
      <div id="loginError" style="display:none;background:#ffe4e6;color:#9f1239;padding:8px 10px;border-radius:10px;font-size:11.5px;font-weight:700;margin-bottom:12px;"></div>
      <div style="text-align:left;margin-bottom:10px;">
        <label class="field-lbl">Numero Tessera Socio</label>
        <input id="inpTessera" class="input" type="text" placeholder="Es. PL-2026-001" />
      </div>
      <div style="text-align:left;margin-bottom:16px;">
        <label class="field-lbl">PIN Personale</label>
        <input id="inpPin" class="input" type="password" placeholder="Inserisci PIN" />
      </div>
      <button type="button" class="btn" style="width:100%;padding:12px;" onclick="unlockApp()">Sblocca Portale Socio</button>
    </div>
  </div>

  <!-- BARRA SUPERIORE CON VERSIONE IN ALTO A DESTRA -->
  <header class="topbar">
    <div class="topbar-row">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <img src="file:///android_asset/icon.png" onerror="this.onerror=null;this.src='/icon.svg';" alt="Logo Pro Loco" style="width:38px;height:38px;border-radius:10px;border:1.5px solid rgba(251,191,36,0.6);flex-shrink:0;" />
        <div style="min-width:0;">
          <div id="hdrProLoco" class="brand-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nomeProLoco}</div>
          <div id="hdrSocioSub" class="brand-sub">Portale Ufficiale del Socio</div>
        </div>
      </div>
      <div class="topbar-right">
        <div class="sync-pill" onclick="syncWithServer(true)" style="cursor:pointer;" title="Tocca per sincronizzare ora col server">
          <span id="syncDot" class="dot"></span>
          <span id="syncLabel">Memoria Locale Attiva</span>
        </div>
        <div id="apkTopRightVersion" class="version-badge-top" title="Versione aggiornamento applicazione APK Socio">
          v${CURRENT_APK_VERSION_NAME}
        </div>
      </div>
    </div>
  </header>

  <!-- TABS DI NAVIGAZIONE -->
  <nav class="tabs">
    <button class="tab-btn active" id="tabBtn-tessera" onclick="switchTab('tessera')">🪪 Tessera</button>
    <button class="tab-btn" id="tabBtn-anagrafica" onclick="switchTab('anagrafica')">👤 Anagrafica</button>
    <button class="tab-btn" id="tabBtn-pagamenti" onclick="switchTab('pagamenti')">🧾 Quote (<span id="cntQuote">0</span>)</button>
    <button class="tab-btn" id="tabBtn-comunicazioni" onclick="switchTab('comunicazioni')">📰 Comunicazioni & Giornalino (<span id="cntCom">0</span>)</button>
    <button class="tab-btn" id="tabBtn-eventi" onclick="switchTab('eventi')">🎉 Eventi (<span id="cntEventi">0</span>)</button>
  </nav>

  <main class="container">
    <div class="banner-evergreen">
      <div>
        <strong id="bannerTitle">Sincronizzazione Continua Attiva:</strong>
        <span id="bannerDesc">Consultabile anche offline. Quando il server è acceso i dati si scambiano in automatico con qualsiasi versione del gestionale.</span>
      </div>
      <button type="button" class="btn btn-secondary" style="padding:6px 10px;font-size:11px;white-space:nowrap;" onclick="openFullWebPortal()">Versione Web</button>
    </div>

    <!-- SEZIONE 1: TESSERA -->
    <section id="sec-tessera">
      <div class="card-tessera">
        <div class="card-head">
          <div>
            <div id="cardProLoco" style="font-size:13px;font-weight:900;text-transform:uppercase;">${nomeProLoco}</div>
            <div style="font-size:10.5px;color:#a7f3d0;">Tessera Digitale Socio • Anno <span id="cardAnno">${annoCorrenteApk}</span></div>
          </div>
          <span class="unpli-tag">UNPLI CTS</span>
        </div>
        <div>
          <span class="socio-label">Intestatario della Tessera</span>
          <div id="cardNomeSocio" class="socio-name">${nomeSocio}</div>
          <div id="cardCfSocio" class="socio-cf"></div>
        </div>
        <div class="card-foot">
          <div>
            <span class="socio-label">Numero Tessera</span>
            <div id="cardNumeroTessera" class="tessera-num">${tesseraUfficiale || 'PL-2026-001'}</div>
            <div id="cardCategoria" style="font-size:11px;color:#a7f3d0;margin-top:2px;">Socio Ordinario</div>
          </div>
          <div style="text-align:right;">
            <span id="cardStatoBadge" class="status-badge">TESSERA ATTIVA</span>
            <div id="cardScadenza" style="font-size:10px;color:#d1fae5;margin-top:4px;">Valida fino al 31/12/${annoCorrenteApk}</div>
          </div>
        </div>
      </div>

      <div class="box">
        <div class="box-title">
          <span>Sincronizzazione Bidirezionale Server</span>
          <button type="button" class="btn" style="padding:6px 12px;font-size:11px;" onclick="syncWithServer(true)">🔄 Sincronizza Ora</button>
        </div>
        <p id="syncDetailText" style="font-size:12px;color:#57534e;line-height:1.45;margin-bottom:10px;">
          Sincronizzazione automatica bidirezionale attiva e pienamente compatibile con tutte le versioni del gestionale. Tutti i dati della tua tessera, le ricevute, gli eventi e i numeri del Giornalino restano sempre consultabili anche a server spento.
        </p>
        <div style="background:#f5f5f4;border:1px solid #e7e5e4;border-radius:12px;padding:10px 12px;">
          <div style="font-size:10.5px;font-weight:800;color:#44403c;text-transform:uppercase;margin-bottom:4px;">
            Indirizzo Server Attivo (Auto-Discovery Cloud / Wi-Fi LAN / Tunnel)
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input id="customServerEndpointInput" class="input" style="margin-top:0;font-size:11.5px;font-family:monospace;" type="text" value="${activeTryCloudflareUrl || db.lastActiveTunnelUrl || ''}" placeholder="${activeTryCloudflareUrl || db.lastActiveTunnelUrl || 'https://...trycloudflare.com'}" />
            <button type="button" class="btn btn-secondary" style="padding:8px 10px;font-size:11px;white-space:nowrap;" onclick="saveCustomServerEndpoint()">Salva Server</button>
          </div>
          <div id="activeEndpointBadge" style="font-size:10.5px;color:#059669;font-weight:700;margin-top:5px;font-family:monospace;word-break:break-all;"></div>
        </div>
      </div>
    </section>

    <!-- SEZIONE 2: ANAGRAFICA (CON MODIFICA OFFLINE + CODA DI SCAMBIO QUANDO IL SERVER SI ACCENDE) -->
    <section id="sec-anagrafica" style="display:none;">
      <div class="box">
        <div class="box-title">
          <span>I Tuoi Dati Anagrafici</span>
          <button type="button" class="btn" style="padding:6px 12px;font-size:11px;" onclick="saveAnagraficaOffline()">💾 Salva Recapiti</button>
        </div>
        <div id="anagraficaSavedMsg" style="display:none;background:#d1fae5;color:#065f46;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;">
          Recapiti salvati! Verranno scambiati automaticamente col gestionale appena il server è acceso.
        </div>
        <div class="field-grid">
          <div class="field">
            <span class="field-lbl">Nome e Cognome</span>
            <div id="anaNome" class="field-val">-</div>
          </div>
          <div class="field">
            <span class="field-lbl">Numero Tessera</span>
            <div id="anaTessera" class="field-val" style="font-family:monospace;">-</div>
          </div>
          <div class="field">
            <span class="field-lbl">Codice Fiscale</span>
            <div id="anaCf" class="field-val" style="font-family:monospace;">-</div>
          </div>
          <div class="field">
            <span class="field-lbl">Categoria & Ruolo</span>
            <div id="anaCategoria" class="field-val">-</div>
          </div>
          <div class="field">
            <span class="field-lbl">Telefono / Cellulare (Modificabile anche offline)</span>
            <input id="editTelefono" class="input" type="text" placeholder="Inserisci telefono" />
          </div>
          <div class="field">
            <span class="field-lbl">Email Personale (Modificabile anche offline)</span>
            <input id="editEmail" class="input" type="email" placeholder="Inserisci email" />
          </div>
          <div class="field" style="grid-column: 1 / -1;">
            <span class="field-lbl">Indirizzo di Residenza (Modificabile anche offline)</span>
            <input id="editIndirizzo" class="input" type="text" placeholder="Via / Piazza e numero civico" />
          </div>
        </div>
      </div>
    </section>

    <!-- SEZIONE 3: QUOTE & RICEVUTE -->
    <section id="sec-pagamenti" style="display:none;">
      <div class="box">
        <div class="box-title"><span>Storico Quote & Ricevute</span></div>
        <div id="listaQuoteContainer"></div>
      </div>
    </section>

    <!-- SEZIONE 4: COMUNICAZIONI & GIORNALINO PRO LOCO -->
    <section id="sec-comunicazioni" style="display:none;">
      <div class="box">
        <div class="box-title">
          <span>Comunicazioni & Uscite Giornalino</span>
          <span style="font-size:11px;color:#059669;font-weight:700;">Rif. Tessera: <span id="comRifTessera">${tesseraUfficiale || 'TUTTI'}</span></span>
        </div>
        <div id="listaComunicazioniContainer"></div>
      </div>
    </section>

    <!-- SEZIONE 5: EVENTI & ISCRIZIONE OFFLINE/ONLINE -->
    <section id="sec-eventi" style="display:none;">
      <div class="box">
        <div class="box-title"><span>Calendario Eventi & Partecipazione Soci</span></div>
        <div id="listaEventiContainer"></div>
      </div>
    </section>
  </main>

  <!-- BANNER AGGIORNAMENTO OPZIONALE APK -->
  <div id="versionOptionalBanner" style="display:none;background:#fef3c7;border-bottom:1px solid #f59e0b;padding:8px 14px;font-size:11.5px;color:#92400e;align-items:center;justify-content:space-between;gap:8px;">
    <div><strong>Nuova versione APK disponibile:</strong> aggiorna per avere le ultime funzioni del gestionale.</div>
    <a id="versionOptionalLink" href="#" class="btn" style="padding:5px 10px;font-size:10.5px;background:#d97706;">Aggiorna APK</a>
  </div>

  <!-- MODALE CONTROLLO VERSIONE MINIMA OBBLIGATORIA -->
  <div id="versionMandatoryModal" class="modal-backdrop" style="z-index:200;">
    <div class="modal-box" style="max-width:400px;">
      <div class="modal-head" style="background:#b91c1c;">
        <div>
          <div style="font-size:10px;text-transform:uppercase;color:#fecaca;font-weight:800;">AGGIORNAMENTO OBBLIGATORIO SISTEMA</div>
          <div style="font-size:15px;font-weight:900;">Nuova Versione Richiesta</div>
        </div>
      </div>
      <div class="modal-body" style="text-align:center;">
        <p id="versionMandatoryMsg" style="font-size:13px;color:#1c1917;margin-bottom:12px;font-weight:600;">
          Il sistema gestionale della Pro Loco ha ricevuto un aggiornamento strutturale critico. Per garantire l'integrità dei dati è necessario aggiornare l'applicazione APK.
        </p>
        <div style="background:#f5f5f4;border-radius:10px;padding:10px;font-size:11.5px;color:#57534e;margin-bottom:14px;">
          Versione installata: <strong id="verInstalledLbl">1.0.0</strong> • Versione minima richiesta: <strong id="verRequiredLbl">2.0.0</strong>
        </div>
        <a id="versionMandatoryDownloadBtn" href="#" class="btn" style="width:100%;justify-content:center;padding:12px;font-size:13px;background:#059669;">
          ⬇️ Scarica e Installa Nuovo APK
        </a>
      </div>
    </div>
  </div>

  <!-- MODALE LETTURA USCITA GIORNALINO -->
  <div id="giornalinoModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-head">
        <div>
          <div id="gmNumero" style="font-size:10px;text-transform:uppercase;color:#a5b4fc;font-weight:800;">GIORNALINO PRO LOCO</div>
          <div id="gmTitolo" style="font-size:15px;font-weight:900;">Fascicolo</div>
        </div>
        <button type="button" class="btn btn-secondary" style="padding:5px 10px;font-size:11px;" onclick="closeGiornalinoModal()">Chiudi ✕</button>
      </div>
      <div id="gmBody" class="modal-body"></div>
    </div>
  </div>

  <script id="initial-snapshot" type="application/json">${safeEmbeddedJson}</script>
  <script>
    var APK_CLIENT_VERSION_CODE = ${CURRENT_APK_VERSION_CODE};
    var APK_CLIENT_VERSION_NAME = '${CURRENT_APK_VERSION_NAME}';
    var STORAGE_SNAPSHOT_KEY = 'proloco_apk_evergreen_snapshot_v1';
    var STORAGE_OUTBOX_KEY = 'proloco_apk_evergreen_outbox_v1';
    var STORAGE_UNLOCKED_KEY = 'proloco_apk_unlocked_v1';
    var IDB_NAME = 'ProLocoLocalRoomSQLiteDB';
    var IDB_VERSION = 2;
    var idbInstance = null;

    function normCode(v) {
      var str = String(v || '').toUpperCase();
      var out = '';
      for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90)) {
          out += str.charAt(i);
        }
      }
      return out;
    }

    function cleanUrlBase(u) {
      var s = String(u || '').trim();
      while (s.length > 0 && s.charAt(s.length - 1) === '/') {
        s = s.substring(0, s.length - 1);
      }
      return s;
    }

    // Motore di Caching Locale Persistente (IndexedDB stile SQLite/Room + fallback sincrono LocalStorage)
    function openLocalRoomDB() {
      return new Promise(function(resolve) {
        if (idbInstance) return resolve(idbInstance);
        if (typeof indexedDB === 'undefined') return resolve(null);
        try {
          var req = indexedDB.open(IDB_NAME, IDB_VERSION);
          req.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('snapshots')) {
              db.createObjectStore('snapshots', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('outbox_queue')) {
              db.createObjectStore('outbox_queue', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('sync_journal')) {
              db.createObjectStore('sync_journal', { keyPath: 'id' });
            }
          };
          req.onsuccess = function(e) {
            idbInstance = e.target.result;
            resolve(idbInstance);
          };
          req.onerror = function() { resolve(null); };
        } catch (err) {
          resolve(null);
        }
      });
    }

    function writeRoomStore(storeName, record) {
      openLocalRoomDB().then(function(db) {
        if (!db) return;
        try {
          var tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).put(record);
        } catch (e) {}
      });
    }

    function hydrateFromRoomDB() {
      openLocalRoomDB().then(function(db) {
        if (!db) return;
        try {
          var tx = db.transaction(['snapshots', 'outbox_queue'], 'readonly');
          var snapReq = tx.objectStore('snapshots').get('main_snapshot');
          snapReq.onsuccess = function() {
            var res = snapReq.result;
            if (res && res.payload && Number(res.updatedAt || 0) > Number(appState.updatedAt || 0)) {
              appState = Object.assign({}, appState, res.payload);
              try { localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(appState)); } catch (e) {}
              renderUI();
            }
          };
        } catch (e) {}
      });
    }

    function loadState() {
      var embedded = {};
      try {
        embedded = JSON.parse(document.getElementById('initial-snapshot').textContent || '{}');
      } catch (e) {}
      try {
        var cachedRaw = localStorage.getItem(STORAGE_SNAPSHOT_KEY);
        if (cachedRaw) {
          var cached = JSON.parse(cachedRaw);
            var liveTun = '${activeTryCloudflareUrl || db.lastActiveTunnelUrl || ''}';
            var eps = [liveTun].concat(embedded.endpoints || [], cached.endpoints || []);
            cached.endpoints = eps.filter(function(item, pos) { return item && eps.indexOf(item) === pos; });
            return cached;
        }
      } catch (e) {}
      saveState(embedded);
      return embedded;
    }

    function saveState(st) {
      try {
        localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(st));
      } catch (e) {}
      writeRoomStore('snapshots', { id: 'main_snapshot', updatedAt: Date.now(), payload: st });
    }

    function loadOutbox() {
      try {
        var raw = localStorage.getItem(STORAGE_OUTBOX_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function saveOutbox(ob) {
      try {
        localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(ob));
      } catch (e) {}
      writeRoomStore('outbox_queue', { id: 'pending_outbox', updatedAt: Date.now(), payload: ob });
    }

    function checkMandatoryApkVersion(policy, downloadUrl) {
      // Regola Tassativa: anche se la versione dell'APK e la versione del gestionale differiscono,
      // i due sistemi dialogano sempre senza generare errori di incompatibilità o blocchi di sistema.
      var modal = document.getElementById('versionMandatoryModal');
      if (modal) modal.style.display = 'none';
      var topBadge = document.getElementById('apkTopRightVersion');
      if (topBadge) {
        topBadge.innerText = 'v' + APK_CLIENT_VERSION_NAME;
      }
    }

    var appState = loadState();
    var isServerOnline = false;

    function checkPinGate() {
      var socio = appState.socio || {};
      var unlocked = false;
      try {
        unlocked = localStorage.getItem(STORAGE_UNLOCKED_KEY) === normCode(socio.numeroTessera);
      } catch (e) {}
      var inpT = document.getElementById('inpTessera');
      if (inpT && socio.numeroTessera) inpT.value = socio.numeroTessera;
      // Se il pacchetto è stato generato per il socio con PIN preimpostato, sblocca direttamente
      if (socio.numeroTessera && socio.pin) {
        try { localStorage.setItem(STORAGE_UNLOCKED_KEY, normCode(socio.numeroTessera)); } catch (e) {}
        unlocked = true;
      }
      document.getElementById('loginGate').style.display = unlocked ? 'none' : 'flex';
    }

    function unlockApp() {
      var t = (document.getElementById('inpTessera').value || '').trim().toUpperCase();
      var p = (document.getElementById('inpPin').value || '').trim();
      var socio = appState.socio || {};
      var expectedPin = String(socio.pin || '1234').trim().toUpperCase();
      if (t && (!socio.numeroTessera || normCode(t) === normCode(socio.numeroTessera)) && p.toUpperCase() === expectedPin) {
        try { localStorage.setItem(STORAGE_UNLOCKED_KEY, normCode(t)); } catch (e) {}
        document.getElementById('loginGate').style.display = 'none';
      } else {
        var err = document.getElementById('loginError');
        err.style.display = 'block';
        err.innerText = 'Numero Tessera o PIN non corrispondenti.';
      }
    }

    function switchTab(tab) {
      var tabs = ['tessera', 'anagrafica', 'pagamenti', 'comunicazioni', 'eventi'];
      for (var i = 0; i < tabs.length; i++) {
        var name = tabs[i];
        var sec = document.getElementById('sec-' + name);
        var btn = document.getElementById('tabBtn-' + name);
        if (sec) sec.style.display = name === tab ? 'block' : 'none';
        if (btn) {
          if (name === tab) btn.classList.add('active');
          else btn.classList.remove('active');
        }
      }
    }

    function renderUI() {
      var cfg = appState.config || {};
      var socio = appState.socio || {};
      var anno = appState.anno || new Date().getFullYear();

      document.getElementById('hdrProLoco').innerText = cfg.nome || appState.proLoco || 'Pro Loco';
      document.getElementById('cardProLoco').innerText = cfg.nome || appState.proLoco || 'Pro Loco';
      document.getElementById('cardAnno').innerText = anno;
      document.getElementById('cardNomeSocio').innerText = ((socio.nome || '') + ' ' + (socio.cognome || '')).trim() || 'Socio Pro Loco';
      document.getElementById('cardCfSocio').innerText = socio.codiceFiscale ? ('C.F. ' + socio.codiceFiscale) : '';
      document.getElementById('cardNumeroTessera').innerText = socio.numeroTessera || 'PL-2026-001';
      document.getElementById('cardCategoria').innerText = (socio.categoria || 'Ordinario') + (socio.ruoloDirettivo && socio.ruoloDirettivo !== 'Nessuno' ? ' • ' + socio.ruoloDirettivo : '');
      document.getElementById('comRifTessera').innerText = socio.numeroTessera || 'TUTTI';

      var quote = Array.isArray(socio.quote) ? socio.quote : [];
      var inRegola = quote.some(function(q) { return Number(q.anno) === Number(anno); });
      var badge = document.getElementById('cardStatoBadge');
      badge.innerText = inRegola ? 'TESSERA IN REGOLA' : 'DA RINNOVARE';
      badge.style.background = inRegola ? '#10b981' : '#f59e0b';

      // Anagrafica
      document.getElementById('anaNome').innerText = ((socio.nome || '') + ' ' + (socio.cognome || '')).trim();
      document.getElementById('anaTessera').innerText = socio.numeroTessera || '-';
      document.getElementById('anaCf').innerText = socio.codiceFiscale || '-';
      document.getElementById('anaCategoria').innerText = (socio.categoria || 'Ordinario') + (socio.ruoloDirettivo && socio.ruoloDirettivo !== 'Nessuno' ? ' (' + socio.ruoloDirettivo + ')' : '');

      var editTel = document.getElementById('editTelefono');
      var editEm = document.getElementById('editEmail');
      var editInd = document.getElementById('editIndirizzo');
      if (document.activeElement !== editTel) editTel.value = socio.telefono || '';
      if (document.activeElement !== editEm) editEm.value = socio.email || '';
      if (document.activeElement !== editInd) editInd.value = socio.indirizzo || '';

      // Quote
      document.getElementById('cntQuote').innerText = quote.length;
      var qHtml = '';
      if (quote.length === 0) {
        qHtml = '<p style="font-size:12px;color:#78716c;">Nessuna quota registrata.</p>';
      } else {
        for (var i = 0; i < quote.length; i++) {
          var q = quote[i];
          qHtml += '<div class="com-item" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<div style="font-weight:800;font-size:13px;color:#065f46;">Anno Sociale ' + q.anno + ' • Ricevuta ' + (q.ricevutaNumero || '-') + '</div>' +
              '<div style="font-size:11.5px;color:#57534e;">Versato il ' + (q.dataPagamento || '-') + ' (' + (q.metodo || 'Contanti') + ')</div>' +
            '</div>' +
            '<div style="font-size:15px;font-weight:900;color:#1c1917;">€ ' + Number(q.importo || 0).toFixed(2) + '</div>' +
          '</div>';
        }
      }
      document.getElementById('listaQuoteContainer').innerHTML = qHtml;

      // Comunicazioni & Giornalino filtrati per Numero Tessera + Archivio Edizioni Giornalino
      var tutteCom = Array.isArray(appState.comunicazioni) ? appState.comunicazioni : [];
      var mieCom = tutteCom.filter(function(c) {
        if (!c.numeroTesseraRiferimento || c.numeroTesseraRiferimento === 'TUTTI') return true;
        if (!socio.numeroTessera) return true;
        return normCode(c.numeroTesseraRiferimento) === normCode(socio.numeroTessera);
      });
      var archivioEdizioni = Array.isArray(appState.archivioGiornalini) ? appState.archivioGiornalini : [];
      document.getElementById('cntCom').innerText = mieCom.length + archivioEdizioni.length;

      var cHtml = '';
      if (archivioEdizioni.length > 0) {
        cHtml += '<div style="margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#312e81;margin-bottom:8px;letter-spacing:0.04em;">📰 Archivio Edizioni Giornalino (' + archivioEdizioni.length + ')</div>';
        for (var g = 0; g < archivioEdizioni.length; g++) {
          var edItem = archivioEdizioni[g] || {};
          var edCfg = edItem.config || edItem;
          var numLabel = edItem.numeroEdizione || edCfg.numeroEdizione || (edItem.numeroUscita ? ('N. ' + edItem.numeroUscita) : ('Edizione ' + (g + 1)));
          var perLabel = edItem.periodo || edCfg.periodo || edItem.dataPubblicazione || edCfg.dataPubblicazione || edItem.meseAnno || edItem.anno || '';
          var testataLabel = edItem.testata || edCfg.testata || edItem.titoloTestata || edItem.titoloPrincipale || 'Giornalino Pro Loco';
          var artList = Array.isArray(edItem.articoli) ? edItem.articoli : (Array.isArray(edCfg.articoli) ? edCfg.articoli : []);
          cHtml += '<div class="com-item giornalino">' +
            '<div class="com-meta">' +
              '<span class="tag giornalino">📰 ' + numLabel + '</span>' +
              (perLabel ? '<span class="tag tessera">' + perLabel + '</span>' : '') +
              '<span style="font-size:11px;color:#78716c;">' + artList.length + ' articoli</span>' +
            '</div>' +
            '<div class="com-title">' + testataLabel + ' — ' + numLabel + '</div>' +
            (edItem.sottotitoloTestata || edCfg.sottotitoloTestata ? '<div style="font-size:11.5px;color:#57534e;margin-bottom:6px;">' + (edItem.sottotitoloTestata || edCfg.sottotitoloTestata) + '</div>' : '') +
            '<div style="margin-top:8px;"><button type="button" class="btn btn-indigo" onclick="openGiornalinoByEditionIndex(' + g + ')">📖 Sfoglia e Leggi Giornalino (' + numLabel + ')</button></div>' +
          '</div>';
        }
        cHtml += '</div>';
      }

      if (mieCom.length === 0 && archivioEdizioni.length === 0) {
        cHtml = '<p style="font-size:12px;color:#78716c;">Nessuna comunicazione o uscita presente in archivio.</p>';
      } else if (mieCom.length > 0) {
        cHtml += '<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#065f46;margin-bottom:8px;letter-spacing:0.04em;">📬 Comunicazioni & Notifiche Socio (' + mieCom.length + ')</div>';
        for (var j = 0; j < mieCom.length; j++) {
          var c = mieCom[j];
          var isG = c.categoria === 'giornalino' || Boolean(c.edizioneGiornalinoId) || Boolean(c.edizioneGiornalinoSnapshot);
          cHtml += '<div class="com-item ' + (isG ? 'giornalino' : '') + '">' +
            '<div class="com-meta">' +
              '<span class="tag ' + (isG ? 'giornalino' : '') + '">' + (isG ? '📰 GIORNALINO PRO LOCO' : (c.categoria || 'AVVISO')) + '</span>' +
              (c.numeroTesseraRiferimento ? '<span class="tag tessera">Rif. Tessera: ' + c.numeroTesseraRiferimento + '</span>' : '') +
              '<span style="font-size:11px;color:#78716c;">' + (c.dataPubblicazione || '') + '</span>' +
            '</div>' +
            '<div class="com-title">' + (c.titolo || '') + '</div>' +
            (c.oggetto ? '<div style="font-size:11.5px;font-weight:700;color:#065f46;margin-bottom:4px;">' + c.oggetto + '</div>' : '') +
            '<div class="com-body">' + (c.contenuto || '') + '</div>' +
            (isG ? '<div style="margin-top:10px;"><button type="button" class="btn btn-indigo" onclick="openGiornalinoByComIndex(' + j + ')">📖 Sfoglia e Leggi Uscita Giornalino (Anche Offline)</button></div>' : '') +
          '</div>';
        }
      }
      document.getElementById('listaComunicazioniContainer').innerHTML = cHtml;

      // Eventi
      var eventi = Array.isArray(appState.eventi) ? appState.eventi : [];
      document.getElementById('cntEventi').innerText = eventi.length;
      var eHtml = '';
      if (eventi.length === 0) {
        eHtml = '<p style="font-size:12px;color:#78716c;">Nessun evento in programma.</p>';
      } else {
        for (var k = 0; k < eventi.length; k++) {
          var ev = eventi[k];
          var iscritti = Array.isArray(ev.iscrizioni) ? ev.iscrizioni : [];
          var giaIscritto = iscritti.some(function(i) {
            return i.socioId === socio.id || normCode(i.socioTessera) === normCode(socio.numeroTessera);
          });
          eHtml += '<div class="com-item">' +
            '<div class="com-meta">' +
              '<span class="tag">' + (ev.categoria || 'Evento') + '</span>' +
              '<span style="font-size:11px;color:#57534e;">📍 ' + (ev.luogo || '') + ' • 📅 ' + (ev.dataInizio || '') + '</span>' +
            '</div>' +
            '<div class="com-title">' + (ev.titolo || '') + '</div>' +
            '<div style="font-size:12px;color:#57534e;margin-bottom:10px;">' + (ev.descrizione || '') + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-size:12px;font-weight:800;color:#065f46;">' + (ev.quotaIscrizioneSocio ? ('Quota Socio: € ' + ev.quotaIscrizioneSocio) : 'Gratuito per i Soci') + '</span>' +
              (giaIscritto
                ? '<span class="tag tessera">✓ ISCRITTO</span>'
                : '<button type="button" class="btn" style="padding:7px 12px;font-size:11px;" onclick="iscrivitiEventoOffline(' + k + ')">Partecipa / Iscriviti</button>') +
            '</div>' +
          '</div>';
        }
      }
      document.getElementById('listaEventiContainer').innerHTML = eHtml;
    }

    function renderEdizioneInModal(edRaw) {
      var modal = document.getElementById('giornalinoModal');
      var body = document.getElementById('gmBody');
      var ed = (edRaw && edRaw.config) ? Object.assign({}, edRaw.config, edRaw) : (edRaw || {});
      var num = ed.numeroEdizione || (ed.numeroUscita ? ('USCITA N° ' + ed.numeroUscita) : 'GIORNALINO');
      var per = ed.periodo || ed.dataPubblicazione || ed.meseAnno || '';
      document.getElementById('gmNumero').innerText = num + (per ? (' • ' + per) : '');
      document.getElementById('gmTitolo').innerText = ed.testata || ed.titoloTestata || ed.titoloPrincipale || ed.sottotitoloTestata || ed.sottotitolo || 'Giornalino Pro Loco';
      var html = '';
      if (ed.editorialePresidente) {
        html += '<div style="background:#f5f5f4;padding:12px;border-left:4px solid #059669;border-radius:8px;margin-bottom:14px;">' +
          '<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#065f46;margin-bottom:4px;">Editoriale del Presidente</div>' +
          '<div style="white-space:pre-line;font-style:italic;">' + ed.editorialePresidente + '</div>' +
        '</div>';
      }
      var articoli = Array.isArray(ed.articoli) ? ed.articoli : [];
      for (var a = 0; a < articoli.length; a++) {
        var art = articoli[a] || {};
        var testoArt = art.contenuto !== undefined ? art.contenuto : (art.testo || '');
        html += '<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e7e5e4;">' +
          '<div style="font-size:10px;font-weight:800;color:#4f46e5;text-transform:uppercase;">' + (art.occhiello || art.sezione || art.categoria || 'Articolo') + ' • Pag. ' + (art.pagina || 1) + (art.autore ? (' • ' + art.autore) : '') + '</div>' +
          '<h4 style="font-size:15px;font-weight:900;color:#1c1917;margin:3px 0;">' + (art.titolo || '') + '</h4>' +
          (art.sottotitolo ? '<div style="font-size:12px;color:#57534e;font-weight:600;margin-bottom:6px;">' + art.sottotitolo + '</div>' : '') +
          '<div style="white-space:pre-line;font-size:12.5px;color:#292524;">' + testoArt + '</div>' +
        '</div>';
      }
      body.innerHTML = html || '<p>Fascicolo pronto per la consultazione.</p>';
      modal.style.display = 'flex';
    }

    function openGiornalinoByEditionIndex(idx) {
      var archivioEdizioni = Array.isArray(appState.archivioGiornalini) ? appState.archivioGiornalini : [];
      var ed = archivioEdizioni[idx];
      if (!ed) return;
      renderEdizioneInModal(ed);
    }

    function openGiornalinoByComIndex(idx) {
      var socio = appState.socio || {};
      var tutteCom = Array.isArray(appState.comunicazioni) ? appState.comunicazioni : [];
      var mieCom = tutteCom.filter(function(c) {
        if (!c.numeroTesseraRiferimento || c.numeroTesseraRiferimento === 'TUTTI') return true;
        if (!socio.numeroTessera) return true;
        return normCode(c.numeroTesseraRiferimento) === normCode(socio.numeroTessera);
      });
      var c = mieCom[idx];
      if (!c) return;
      var ed = null;
      if (c.edizioneGiornalinoId && Array.isArray(appState.archivioGiornalini)) {
        for (var i = 0; i < appState.archivioGiornalini.length; i++) {
          if (appState.archivioGiornalini[i].id === c.edizioneGiornalinoId) {
            ed = appState.archivioGiornalini[i];
            break;
          }
        }
      }
      if (!ed && c.edizioneGiornalinoSnapshot) {
        ed = c.edizioneGiornalinoSnapshot;
      }
      var modal = document.getElementById('giornalinoModal');
      var body = document.getElementById('gmBody');
      if (!ed) {
        document.getElementById('gmNumero').innerText = 'COMUNICAZIONE GIORNALINO';
        document.getElementById('gmTitolo').innerText = c.titolo || 'Giornalino Pro Loco';
        body.innerHTML = '<div style="white-space:pre-line;">' + (c.contenuto || '') + '</div>';
        modal.style.display = 'flex';
        return;
      }
      renderEdizioneInModal(ed);
    }

    function closeGiornalinoModal() {
      document.getElementById('giornalinoModal').style.display = 'none';
    }

    function saveAnagraficaOffline() {
      var tel = document.getElementById('editTelefono').value.trim();
      var em = document.getElementById('editEmail').value.trim();
      var ind = document.getElementById('editIndirizzo').value.trim();
      if (!appState.socio) return;
      var nowTs = Date.now();
      appState.socio.telefono = tel;
      appState.socio.email = em;
      appState.socio.indirizzo = ind;
      appState.socio.last_updated = nowTs;
      appState.socio.is_dirty = true;
      appState.is_dirty = true;
      appState.last_updated = nowTs;
      saveState(appState);

      var ob = loadOutbox();
      ob.is_dirty = true;
      ob.last_updated = nowTs;
      ob.socioUpdate = {
        numeroTessera: appState.socio.numeroTessera,
        telefono: tel,
        email: em,
        indirizzo: ind,
        is_dirty: true,
        last_updated: nowTs,
        updatedAt: nowTs
      };
      saveOutbox(ob);

      var msg = document.getElementById('anagraficaSavedMsg');
      msg.style.display = 'block';
      setTimeout(function() { msg.style.display = 'none'; }, 3500);
      syncWithServer(true);
    }

    function iscrivitiEventoOffline(evIdx) {
      var eventi = Array.isArray(appState.eventi) ? appState.eventi : [];
      var ev = eventi[evIdx];
      var socio = appState.socio;
      if (!ev || !socio) return;
      if (!Array.isArray(ev.iscrizioni)) ev.iscrizioni = [];
      var nowTs = Date.now();
      var nuovaIscr = {
        id: 'iscr-apk-' + ev.id + '-' + nowTs,
        socioId: socio.id,
        socioTessera: socio.numeroTessera,
        dataIscrizione: new Date().toISOString().slice(0, 10),
        oraIscrizione: new Date().toTimeString().slice(0, 5),
        ruolo: 'partecipante',
        statoPresenza: 'da_verificare',
        quotaVersata: ev.quotaIscrizioneSocio || 0,
        is_dirty: true,
        last_updated: nowTs,
        note: 'Iscrizione da App APK Socio ' + (socio.nome || '') + ' ' + (socio.cognome || '')
      };
      ev.iscrizioni.push(nuovaIscr);
      appState.is_dirty = true;
      appState.last_updated = nowTs;
      saveState(appState);

      var ob = loadOutbox();
      ob.is_dirty = true;
      ob.last_updated = nowTs;
      if (!Array.isArray(ob.iscrizioniEventi)) ob.iscrizioniEventi = [];
      ob.iscrizioniEventi.push({
        eventoId: ev.id,
        is_dirty: true,
        last_updated: nowTs,
        iscrizione: nuovaIscr
      });
      saveOutbox(ob);

      renderUI();
      syncWithServer(true);
    }

    function setSyncStatus(online, text) {
      isServerOnline = online;
      var dot = document.getElementById('syncDot');
      var lbl = document.getElementById('syncLabel');
      var dtl = document.getElementById('syncDetailText');
      if (online) {
        dot.classList.add('online');
        lbl.innerText = text || 'Server Acceso • Sincronizzato';
        if (dtl) dtl.innerText = 'Connesso al Server Gestionale Pro Loco: scambio dati bidirezionale in tempo reale attivo (is_dirty / server_updated_at) e compatibile con tutte le versioni del gestionale.';
      } else {
        dot.classList.remove('online');
        lbl.innerText = text || 'Server Spento • Retry Automatico';
        if (dtl) dtl.innerText = 'Il server del gestionale è attualmente spento o in riavvio: le modifiche vengono salvate in locale (SQLite/Room is_dirty=true) e la riconnessione automatica con backoff esponenziale (5s, 10s, 30s) allineerà tutto non appena il server tornerà online.';
      }
    }

    // Negoziazione Multi-Versione API (/api/v2/db -> /api/v1/db -> /api/db) per retrocompatibilità totale
    function fetchWithTimeout(url, options, timeoutMs) {
      return new Promise(function(resolve, reject) {
        var done = false;
        var timer = setTimeout(function() {
          if (!done) {
            done = true;
            reject(new Error('timeout'));
          }
        }, timeoutMs || 3500);
        try {
          fetch(url, options || {}).then(function(res) {
            if (!done) {
              done = true;
              clearTimeout(timer);
              resolve(res);
            }
          }).catch(function(err) {
            if (!done) {
              done = true;
              clearTimeout(timer);
              reject(err);
            }
          });
        } catch (e) {
          if (!done) {
            done = true;
            clearTimeout(timer);
            reject(e);
          }
        }
      });
    }

    function tryFetchEndpoint(baseUrl) {
      if (!baseUrl) return Promise.resolve(null);
      var cleanBase = cleanUrlBase(baseUrl);
      var apiPaths = ['/api/v2/db', '/api/v1/db', '/api/db'];
      var idx = 0;
      var lastSyncServerTs = Number(appState.last_sync_server_updated_at || appState.server_updated_at || 0);

      function nextPath() {
        if (idx >= apiPaths.length) return Promise.resolve(null);
        var currentPath = apiPaths[idx++];
        var queryUrl = cleanBase + currentPath + '?t=' + Date.now() + (lastSyncServerTs > 0 ? '&since_ts=' + lastSyncServerTs : '');
        return fetchWithTimeout(queryUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store'
        }, 3500)
          .then(function(res) {
            if (res && res.ok) {
              return res.json().then(function(data) {
                if (data && data.ok) {
                  if (data.tunnelUrl) {
                    var tun = cleanUrlBase(data.tunnelUrl);
                    if (tun && tun.indexOf('.trycloudflare.com') > -1 && tun.indexOf('prostores-email-heat-scientific') === -1) {
                      try { localStorage.setItem('proloco_last_known_tunnel_url', tun); } catch (e) {}
                      if (!Array.isArray(appState.endpoints)) appState.endpoints = [];
                      if (appState.endpoints.indexOf(tun) === -1) {
                        appState.endpoints.unshift(tun);
                        saveState(appState);
                      }
                    }
                  }
                  return {
                    baseUrl: cleanBase,
                    data: data,
                    apiVersion: data.apiVersion || (currentPath.indexOf('v1') > -1 ? 'v1' : 'v2')
                  };
                }
                return nextPath();
              });
            }
            return nextPath();
          })
          .catch(function() {
            return nextPath();
          });
      }

      return nextPath();
    }

    function expandEndpointList(endpoints) {
      var bridgeUrl = '${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}';
      var lastKnownTunnel = '';
      try {
        lastKnownTunnel = cleanUrlBase(localStorage.getItem('proloco_last_known_tunnel_url') || '');
      } catch (e) {}
      var raw = Array.isArray(endpoints) ? endpoints.slice() : [];
      if (lastKnownTunnel && raw.indexOf(lastKnownTunnel) === -1) {
        raw.unshift(lastKnownTunnel);
      }
      if (raw.indexOf(bridgeUrl) === -1) {
        raw.push(bridgeUrl);
      }
      var list = [];
      for (var i = 0; i < raw.length; i++) {
        var c = cleanUrlBase(raw[i]);
        if (c && list.indexOf(c) === -1) {
          list.push(c);
          if (c.indexOf('https://ais-pre-') === 0) {
            var devU = 'https://ais-dev-' + c.substring('https://ais-pre-'.length);
            if (list.indexOf(devU) === -1) list.push(devU);
          } else if (c.indexOf('https://ais-dev-') === 0) {
            var preU = 'https://ais-pre-' + c.substring('https://ais-dev-'.length);
            if (list.indexOf(preU) === -1) list.push(preU);
          }
        }
      }
      return list;
    }

    function tryAllEndpoints(endpoints) {
      var list = expandEndpointList(endpoints);
      var idx = 0;
      function nextEp() {
        if (idx >= list.length) {
          // Se nessun endpoint noto risponde (tunnel scaduto/riavviato), interroga il Canale di Rendezvous Pubblico
          var socioTess = normCode(appState.socio && appState.socio.numeroTessera);
          var relayTopic = '${PROLOCO_RELAY_TOPIC}';
          var socioTopic = socioTess ? (relayTopic + '_' + socioTess) : relayTopic;
          return fetchWithTimeout('https://ntfy.sh/' + socioTopic + '/raw?poll=1', { cache: 'no-store' }, 2500)
            .then(function(res) {
              if (res && res.ok) {
                return res.text().then(function(rawTxt) {
                  var candidateUrl = cleanUrlBase(rawTxt);
                  if (candidateUrl && candidateUrl.indexOf('.trycloudflare.com') > -1) {
                    if (list.indexOf(candidateUrl) === -1) {
                      return tryFetchEndpoint(candidateUrl);
                    }
                  }
                  return null;
                });
              }
              return null;
            })
            .catch(function() {
              // Fallback sul topic generale Pro Loco se quello della tessera non ha risposto
              return fetchWithTimeout('https://ntfy.sh/' + relayTopic + '/raw?poll=1', { cache: 'no-store' }, 2500)
                .then(function(res2) {
                  if (res2 && res2.ok) {
                    return res2.text().then(function(rawTxt2) {
                      var candidateUrl2 = cleanUrlBase(rawTxt2);
                      if (candidateUrl2 && candidateUrl2.indexOf('.trycloudflare.com') > -1) {
                        return tryFetchEndpoint(candidateUrl2);
                      }
                      return null;
                    });
                  }
                  return null;
                })
                .catch(function() { return null; });
            });
        }
        var ep = list[idx++];
        return tryFetchEndpoint(ep).then(function(found) {
          if (found) return found;
          return nextEp();
        });
      }
      return nextEp();
    }

    function pushSocioSyncEndpoints(activeBase, bodyObj) {
      var syncEndpoints = ['/api/v2/socio-sync', '/api/v1/socio-sync', '/api/socio-sync'];
      var idx = 0;
      function nextSync() {
        if (idx >= syncEndpoints.length) return Promise.resolve(null);
        var ep = syncEndpoints[idx++];
        return fetchWithTimeout(activeBase + ep, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        }, 4000)
          .then(function(res) {
            if (res && res.ok) {
              return res.json().then(function(syncData) {
                if (syncData && syncData.ok) return syncData;
                return nextSync();
              });
            }
            return nextSync();
          })
          .catch(function() {
            return nextSync();
          });
      }
      return nextSync();
    }

    var activeSseSource = null;
    var activeConnectedEndpoint = '';
    var activeRelaySseSource = null;
    var retryBackoffStepsMs = [5000, 10000, 30000];
    var currentRetryAttempt = 0;
    var retryTimerId = null;
    var isSyncInFlight = false;

    // CANALE DI RICEZIONE NOTIFICHE TUNNEL PERMANENTE: ascolta il canale pubblico ntfy.sh (anche su linea 4G/5G)
    // Non si interrompe mai anche se il PC locale riavvia il tunnel o cambia IP!
    function connectPermanentRelayStream() {
      if (typeof EventSource === 'undefined') return;
      var socioTess = normCode(appState.socio && appState.socio.numeroTessera);
      var relayTopic = '${PROLOCO_RELAY_TOPIC}';
      var socioTopic = socioTess ? (relayTopic + '_' + socioTess) : relayTopic;

      if (activeRelaySseSource) return;

      try {
        var rEs = new EventSource('https://ntfy.sh/' + socioTopic + '/sse');
        activeRelaySseSource = rEs;
        rEs.onmessage = function(ev) {
          try {
            var msg = JSON.parse(ev.data || '{}');
            var rawMsg = String(msg.message || '').trim();
            if (rawMsg && rawMsg.indexOf('.trycloudflare.com') > -1) {
              var newTun = cleanUrlBase(rawMsg);
              if (newTun) {
                if (!Array.isArray(appState.endpoints)) appState.endpoints = [];
                var pos = appState.endpoints.indexOf(newTun);
                if (pos !== -1) appState.endpoints.splice(pos, 1);
                appState.endpoints.unshift(newTun);
                try { localStorage.setItem('proloco_last_known_tunnel_url', newTun); } catch (e) {}
                saveState(appState);
                var inpEp = document.getElementById('customServerEndpointInput');
                if (inpEp) inpEp.value = newTun;
                setSyncStatus(true, 'Nuovo Tunnel Ricevuto (Canale Tessera ' + (appState.socio ? appState.socio.numeroTessera : '') + ')');
                syncWithServer(true);
              }
            }
          } catch (e) {}
        };
        rEs.onerror = function() {
          try { rEs.close(); } catch (e) {}
          activeRelaySseSource = null;
          setTimeout(connectPermanentRelayStream, 15000);
        };
      } catch (e) {}
    }

    function scheduleNextSyncAttempt(wasSuccess) {
      if (retryTimerId) {
        clearTimeout(retryTimerId);
        retryTimerId = null;
      }
      var delayMs = 3000;
      if (wasSuccess) {
        currentRetryAttempt = 0;
        delayMs = 3000;
      } else {
        var stepIdx = Math.min(currentRetryAttempt, retryBackoffStepsMs.length - 1);
        delayMs = retryBackoffStepsMs[stepIdx];
        currentRetryAttempt++;
      }
      retryTimerId = setTimeout(function() {
        syncWithServer(false);
      }, delayMs);
    }

    function connectRealtimeStream(baseUrl) {
      if (!baseUrl || typeof EventSource === 'undefined') return;
      var clean = cleanUrlBase(baseUrl);
      if (activeSseSource && activeConnectedEndpoint === clean) return;
      if (activeSseSource) {
        try { activeSseSource.close(); } catch (e) {}
        activeSseSource = null;
      }
      activeConnectedEndpoint = clean;
      try {
        var sseUrl = clean + '/api/v2/stream?tessera=' + encodeURIComponent(normCode(appState.socio && appState.socio.numeroTessera)) + '&v=' + APK_CLIENT_VERSION_CODE;
        var es = new EventSource(sseUrl);
        activeSseSource = es;
        es.onmessage = function(ev) {
          try {
            var msg = JSON.parse(ev.data || '{}');
            if (msg && msg.tunnelUrl) {
              var newTun = cleanUrlBase(msg.tunnelUrl);
              if (newTun && newTun.indexOf('.trycloudflare.com') > -1 && newTun.indexOf('prostores-email-heat-scientific') === -1) {
                if (!Array.isArray(appState.endpoints)) appState.endpoints = [];
                var exIdx = appState.endpoints.indexOf(newTun);
                if (exIdx !== -1) appState.endpoints.splice(exIdx, 1);
                appState.endpoints.unshift(newTun);
                try { localStorage.setItem('proloco_last_known_tunnel_url', newTun); } catch (e) {}
                saveState(appState);
                if (msg.type === 'tunnel_update') {
                  setSyncStatus(true, 'Nuovo Tunnel Ricevuto • Sincronizzazione...');
                  syncWithServer(true);
                  return;
                }
              }
            }
            if (msg && (msg.type === 'db_update' || msg.type === 'connected')) {
              syncWithServer(false);
            }
          } catch (err) {}
        };
        es.onerror = function() {
          try { es.close(); } catch (e) {}
          activeSseSource = null;
          scheduleNextSyncAttempt(false);
        };
      } catch (e) {}
    }

    function applyServerDataAndRender(found, db, apkDownloadUrl) {
      var serverPayload = (found && found.data) ? found.data : {};
      var incomingServerTs = Number(
        serverPayload.server_updated_at ||
        db.server_updated_at ||
        db.updatedAt ||
        Date.now()
      );
      var prevServerTs = Number(appState.last_sync_server_updated_at || 0);
      var shouldApplyServerDelta = prevServerTs === 0 || incomingServerTs >= prevServerTs;

      if (shouldApplyServerDelta) {
        if (db.config) appState.config = Object.assign({}, appState.config || {}, db.config);
        if (Array.isArray(db.soci) && appState.socio && appState.socio.numeroTessera) {
          var myNorm = normCode(appState.socio.numeroTessera);
          var freshSocio = null;
          for (var si = 0; si < db.soci.length; si++) {
            if (normCode(db.soci[si].numeroTessera) === myNorm) {
              freshSocio = db.soci[si];
              break;
            }
          }
          if (freshSocio) {
            appState.socio = Object.assign({}, appState.socio, freshSocio, { is_dirty: false });
          }
        }
        if (Array.isArray(db.comunicazioni)) {
          appState.comunicazioni = db.comunicazioni;
        }
        if (Array.isArray(db.eventi)) {
          appState.eventi = db.eventi.filter(function(e) { return e.stato !== 'annullato'; });
        }
        if (Array.isArray(db.archivioGiornalini)) {
          appState.archivioGiornalini = db.archivioGiornalini;
        }
        if (db.lastActiveTunnelUrl && appState.endpoints.indexOf(db.lastActiveTunnelUrl) === -1) {
          appState.endpoints.unshift(db.lastActiveTunnelUrl);
        }
        appState.server_updated_at = incomingServerTs;
        appState.last_sync_server_updated_at = incomingServerTs;
      }

      appState.is_dirty = false;
      appState.updatedAt = Date.now();
      saveState(appState);
      renderUI();
      if (found && found.baseUrl) {
        connectRealtimeStream(found.baseUrl);
        var epBadge = document.getElementById('activeEndpointBadge');
        if (epBadge) {
          epBadge.innerText = '✓ Connesso a: ' + found.baseUrl;
        }
        var inpEp = document.getElementById('customServerEndpointInput');
        if (inpEp && !inpEp.value) {
          inpEp.value = found.baseUrl;
        }
      }
      setSyncStatus(true, 'Server Acceso • Dati Scambiati (' + (found.apiVersion || 'v2') + ')');
      scheduleNextSyncAttempt(true);
    }

    function saveCustomServerEndpoint() {
      var inp = document.getElementById('customServerEndpointInput');
      if (!inp) return;
      var val = cleanUrlBase(inp.value);
      if (!val) return;
      if (val.indexOf('http://') !== 0 && val.indexOf('https://') !== 0) {
        val = (val.indexOf('192.168.') === 0 || val.indexOf('10.') === 0 || val.indexOf('localhost') === 0 || val.indexOf('127.') === 0)
          ? ('http://' + val)
          : ('https://' + val);
      }
      inp.value = val;
      if (!Array.isArray(appState.endpoints)) appState.endpoints = [];
      var existingIdx = appState.endpoints.indexOf(val);
      if (existingIdx !== -1) appState.endpoints.splice(existingIdx, 1);
      appState.endpoints.unshift(val);
      saveState(appState);
      var epBadge = document.getElementById('activeEndpointBadge');
      if (epBadge) {
        epBadge.innerText = 'Connessione a ' + val + ' in corso...';
      }
      currentRetryAttempt = 0;
      syncWithServer(true);
    }

    function syncWithServer(manual) {
      if (isSyncInFlight && !manual) return;
      if (navigator.onLine === false) {
        var pendingOb = loadOutbox();
        var dirtyCount = (pendingOb.socioUpdate ? 1 : 0) + (Array.isArray(pendingOb.iscrizioniEventi) ? pendingOb.iscrizioniEventi.length : 0);
        setSyncStatus(false, dirtyCount > 0 ? ('Offline • ' + dirtyCount + ' Modifiche in Coda (is_dirty)') : 'Offline • Cache Locale SQLite/Room Attiva');
        scheduleNextSyncAttempt(false);
        return;
      }
      isSyncInFlight = true;
      var endpoints = Array.isArray(appState.endpoints) ? appState.endpoints.slice() : [];
      tryAllEndpoints(endpoints).then(function(found) {
        if (!found) {
          isSyncInFlight = false;
          var nextWaitSec = retryBackoffStepsMs[Math.min(currentRetryAttempt, retryBackoffStepsMs.length - 1)] / 1000;
          setSyncStatus(false, 'Server Spento/Riavvio • Retry tra ' + nextWaitSec + 's');
          scheduleNextSyncAttempt(false);
          return;
        }

        var activeBase = found.baseUrl;
        var serverPayload = found.data;
        if (serverPayload.tunnelUrl && endpoints.indexOf(serverPayload.tunnelUrl) === -1) {
          appState.endpoints.unshift(serverPayload.tunnelUrl);
        }

        var socioCorrente = appState.socio || {};
        var apkDownloadUrl = '${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/' + encodeURIComponent(socioCorrente.numeroTessera || 'App_ProLoco') + '.apk';
        if (serverPayload.versionPolicy) {
          checkMandatoryApkVersion(serverPayload.versionPolicy, apkDownloadUrl);
        } else if (serverPayload.db && serverPayload.db.apkVersionPolicy) {
          checkMandatoryApkVersion(serverPayload.db.apkVersionPolicy, apkDownloadUrl);
        }

        var db = serverPayload.db || {};
        var outbox = loadOutbox();
        var hasOutboxMutations = Boolean(
          outbox.is_dirty ||
          outbox.socioUpdate ||
          (Array.isArray(outbox.iscrizioniEventi) && outbox.iscrizioniEventi.length > 0)
        );

        if (!hasOutboxMutations) {
          isSyncInFlight = false;
          applyServerDataAndRender(found, db, apkDownloadUrl);
          return;
        }

        pushSocioSyncEndpoints(activeBase, {
          numeroTessera: socioCorrente.numeroTessera,
          clientVersionCode: APK_CLIENT_VERSION_CODE,
          clientVersionName: APK_CLIENT_VERSION_NAME,
          is_dirty: true,
          last_updated: outbox.last_updated || Date.now(),
          since_ts: Number(appState.last_sync_server_updated_at || 0),
          socioUpdate: outbox.socioUpdate || null,
          iscrizioniEventi: outbox.iscrizioniEventi || []
        }).then(function(syncData) {
          isSyncInFlight = false;
          if (syncData && syncData.ok) {
            if (syncData.db) db = syncData.db;
            if (syncData.server_updated_at) {
              found.data.server_updated_at = syncData.server_updated_at;
            }
            if (syncData.versionPolicy) {
              checkMandatoryApkVersion(syncData.versionPolicy, syncData.downloadApkUrl || apkDownloadUrl);
            }
            saveOutbox({ is_dirty: false, last_updated: 0 });
            writeRoomStore('sync_journal', {
              id: 'sync-' + Date.now(),
              timestamp: Date.now(),
              server_updated_at: syncData.server_updated_at || Date.now(),
              apiVersion: syncData.apiVersion || 'v2',
              conflictsResolved: syncData.conflictsResolved || []
            });
            applyServerDataAndRender(found, db, apkDownloadUrl);
            return;
          }

          // Fallback retrocompatibile per vecchie versioni del backend che espongono solo /api/db
          var needsPush = false;
          if (outbox.socioUpdate && Array.isArray(db.soci)) {
            var upd = outbox.socioUpdate;
            for (var sIdx = 0; sIdx < db.soci.length; sIdx++) {
              if (normCode(db.soci[sIdx].numeroTessera) === normCode(upd.numeroTessera)) {
                db.soci[sIdx].telefono = upd.telefono;
                db.soci[sIdx].email = upd.email;
                db.soci[sIdx].indirizzo = upd.indirizzo;
                db.soci[sIdx].apkUpdatedAt = upd.last_updated || upd.updatedAt || Date.now();
                needsPush = true;
              }
            }
          }
          if (Array.isArray(outbox.iscrizioniEventi) && outbox.iscrizioniEventi.length > 0 && Array.isArray(db.eventi)) {
            for (var m = 0; m < outbox.iscrizioniEventi.length; m++) {
              var item = outbox.iscrizioniEventi[m];
              for (var eIdx = 0; eIdx < db.eventi.length; eIdx++) {
                if (db.eventi[eIdx].id === item.eventoId) {
                  if (!Array.isArray(db.eventi[eIdx].iscrizioni)) db.eventi[eIdx].iscrizioni = [];
                  var exists = db.eventi[eIdx].iscrizioni.some(function(x) {
                    return x.id === item.iscrizione.id || x.socioId === item.iscrizione.socioId || normCode(x.socioTessera) === normCode(item.iscrizione.socioTessera);
                  });
                  if (!exists) {
                    db.eventi[eIdx].iscrizioni.push(item.iscrizione);
                    needsPush = true;
                  }
                }
              }
            }
          }
          if (needsPush) {
            fetchWithTimeout(activeBase + '/api/db', {
              method: 'POST',
              mode: 'cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ soci: db.soci, eventi: db.eventi })
            }, 4000).then(function() {
              saveOutbox({ is_dirty: false, last_updated: 0 });
              applyServerDataAndRender(found, db, apkDownloadUrl);
            }).catch(function() {
              scheduleNextSyncAttempt(false);
            });
          } else {
            saveOutbox({ is_dirty: false, last_updated: 0 });
            applyServerDataAndRender(found, db, apkDownloadUrl);
          }
        });
      });
    }

    function openFullWebPortal() {
      var endpoints = Array.isArray(appState.endpoints) ? appState.endpoints : [];
      tryAllEndpoints(endpoints).then(function(found) {
        if (found) {
          var socio = appState.socio || {};
          var url = found.baseUrl + '/?s=' + encodeURIComponent(socio.numeroTessera || '') + '&pin=' + encodeURIComponent(socio.pin || '1234');
          window.location.href = url;
          return;
        }
        alert('Il server è attualmente spento. Puoi continuare a consultare tutte le sezioni direttamente qui nell\\'applicazione!');
      });
    }

    window.addEventListener('load', function() {
      hydrateFromRoomDB();
      checkPinGate();
      renderUI();
      connectPermanentRelayStream();
      var inpEp = document.getElementById('customServerEndpointInput');
      if (inpEp && Array.isArray(appState.endpoints) && appState.endpoints.length > 0) {
        inpEp.value = appState.endpoints[0];
      }
      syncWithServer(false);
    });
    // Network Change Broadcast & App Foreground Listeners: forza controllo immediato appena la connettività torna stabile
    window.addEventListener('online', function() {
      currentRetryAttempt = 0;
      syncWithServer(true);
    });
    window.addEventListener('focus', function() {
      currentRetryAttempt = 0;
      syncWithServer(false);
    });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        currentRetryAttempt = 0;
        syncWithServer(false);
      }
    });
    if (navigator.connection && typeof navigator.connection.addEventListener === 'function') {
      navigator.connection.addEventListener('change', function() {
        if (navigator.onLine !== false) {
          currentRetryAttempt = 0;
          syncWithServer(true);
        }
      });
    }
  </script>
</body>
</html>`;

      const configJson = JSON.stringify(
        {
          app: appLabel,
          packageId,
          proLoco: nomeProLoco,
          socio: tesseraUfficiale ? { nome: nomeSocio, numeroTessera: tesseraUfficiale, pin: pinSocio } : null,
          startUrl: targetUrl
        },
        null,
        2
      );

      let iconBuffer = Buffer.alloc(0);
      const iconPath = path.join(__dirname, 'public', 'pwa-192x192.png');
      if (fs.existsSync(iconPath)) {
        iconBuffer = fs.readFileSync(iconPath);
      }

      const apkBuffer = buildSignedAndroidApk({
        packageId,
        appLabel,
        launcherHtml: standaloneLauncherHtml,
        configJson,
        iconBuffer
      });

      const safeSlug = (tesseraUfficiale || 'ProLoco')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_');
      const baseName = tesseraUfficiale ? `Socio_${safeSlug}` : `App_ProLoco`;
      const apkFileName = `${baseName}.apk`;

      if (isZipRequested) {
        const readmeContent = `=====================================================
INSTALLAZIONE APPLICAZIONE ANDROID (.APK)
Associazione: ${nomeProLoco}
=====================================================

Destinatario: ${nomeSocio}
Numero Tessera: ${tesseraUfficiale || 'Non specificata'}
PIN: ${pinSocio}

COME INSTALLARE SUL TUO CELLULARE ANDROID:
1. Apri questo file ZIP ed estrai "${apkFileName}".
2. Tocca "${apkFileName}" per avviare l'installazione guidata.
3. Se il tuo cellulare visualizza "Installazione da sorgenti sconosciute bloccata",
   tocca "Impostazioni" e attiva "Consenti da questa fonte".
4. Se Google Play Protect mostra l'avviso di protezione (normale per le app
   distribuite direttamente senza passare dal Play Store), tocca "Più dettagli"
   e poi seleziona "Installa comunque".
5. L'applicazione apparirà subito tra le tue app con l'icona ufficiale e
   si collegherà automaticamente al tuo Portale Soci.

PORTALE WEB DIRETTO (ACCESSO IMMEDIATO SENZA INSTALLAZIONE):
${targetUrl}
=====================================================
`;
        const zipBuffer = buildZipContainer([
          { name: apkFileName, data: apkBuffer },
          { name: 'ISTRUZIONI_INSTALLAZIONE_ANDROID.txt', data: Buffer.from(readmeContent, 'utf-8') }
        ]);

        const zipFileName = `${baseName}.apk.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        res.setHeader('Content-Length', String(zipBuffer.length));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        res.send(zipBuffer);
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${apkFileName}"`);
      res.setHeader('Content-Length', String(apkBuffer.length));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      res.send(apkBuffer);
    } catch (err) {
      console.error('Errore generazione pacchetto APK:', err);
      res.status(500).json({ ok: false, error: 'Errore nella generazione del file APK' });
    }
  };

  // Link Corto APK / ZIP: /apk/2026-001.apk oppure /apk/2026-001.zip
  app.get('/apk/:tesseraFile', (req, res) => {
    serveApkPackage(req, res, req.params.tesseraFile);
  });

  // API Download APK standard: /api/apk/download, /api/v1/apk/download, /api/v2/apk/download, /apk, /download-apk, /app.apk, /ProLoco.apk
  app.get(
    [
      '/api/apk/download',
      '/api/v1/apk/download',
      '/api/v2/apk/download',
      '/apk',
      '/download-apk',
      '/app.apk',
      '/ProLoco.apk'
    ],
    (req, res) => {
      serveApkPackage(req, res);
    }
  );

  // Pagina Mobile Guidata di Installazione Android (ideale per link da WhatsApp e Email)
  app.get(['/inst', '/inst/:tessera'], async (req, res) => {
    const db = readDbFromDisk() || {};
    const rawT = req.params.tessera
      ? String(req.params.tessera).replace(/\.(apk|zip)$/i, '').replace(/^socio[_-]/i, '').trim().toUpperCase()
      : '';
    const normT = rawT.replace(/[^a-zA-Z0-9]/g, '');
    const socioDb = normT && Array.isArray(db.soci)
      ? db.soci.find((s: any) => String(s.numeroTessera || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === normT)
      : null;

    const nomeParam = String(req.query.n || '').trim();
    const cognomeParam = String(req.query.c || '').trim();
    const nomeCompletoParam = `${nomeParam} ${cognomeParam}`.trim();

    const tessera = socioDb?.numeroTessera ? String(socioDb.numeroTessera).trim().toUpperCase() : rawT;
    const nomeSocio =
      nomeCompletoParam ||
      (socioDb ? `${socioDb.nome || ''} ${socioDb.cognome || ''}`.trim() : '') ||
      (tessera ? `Socio ${tessera}` : 'Socio Pro Loco');
    const pinSocio = String(req.query.p || req.query.pin || (socioDb && socioDb.pin) || '1234').trim();
    const nomeProLoco = String((db.config && db.config.nome) || 'Pro Loco').trim();
    const pinToken = toBase64UrlNode(pinSocio);
    const extraQuery = [
      `p=${encodeURIComponent(pinSocio)}`,
      `pk=${encodeURIComponent(pinToken)}`,
      nomeParam || socioDb?.nome ? `n=${encodeURIComponent(nomeParam || socioDb?.nome || '')}` : '',
      cognomeParam || socioDb?.cognome ? `c=${encodeURIComponent(cognomeParam || socioDb?.cognome || '')}` : ''
    ]
      .filter(Boolean)
      .join('&');

    const apkUrl = tessera
      ? `/apk/${encodeURIComponent(tessera)}.apk?${extraQuery}`
      : `/api/apk/download?${extraQuery}`;
    const zipUrl = tessera
      ? `/apk/${encodeURIComponent(tessera)}.zip?${extraQuery}`
      : `/api/apk/download?format=zip&${extraQuery}`;
    const portalUrl = tessera
      ? `/?s=${encodeURIComponent(tessera)}&pin=${encodeURIComponent(pinSocio)}&${extraQuery}`
      : `/?portale=soci`;
    const bridgeApkUrl = `${PERMANENT_BRIDGE_TRYCLOUDFLARE_URL}/apk/${encodeURIComponent(tessera || 'ProLoco')}.apk?${extraQuery}`;
    const targetApkName = tessera ? `Socio_${tessera.replace(/[^a-zA-Z0-9_]/g, '_')}.apk` : 'App_ProLoco.apk';

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Installazione App ${nomeProLoco}${tessera ? ` - Tessera ${tessera}` : ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #f1f5f9; color: #0f172a; padding: 16px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .box { background: #ffffff; max-width: 440px; width: 100%; border-radius: 20px; padding: 24px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .tag { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px; }
    h1 { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .sub { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .socio-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; }
    .socio-card div { margin-bottom: 4px; }
    .btn-apk { display: block; width: 100%; background: #2563eb; color: #ffffff; text-align: center; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px; border-radius: 14px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
    .btn-zip { display: block; width: 100%; background: #475569; color: #ffffff; text-align: center; text-decoration: none; font-weight: 700; font-size: 13px; padding: 11px; border-radius: 12px; margin-bottom: 8px; }
    .btn-web { display: block; width: 100%; background: #059669; color: #ffffff; text-align: center; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px; border-radius: 14px; margin-bottom: 14px; }
    .steps { background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px; font-size: 12px; color: #78350f; line-height: 1.5; }
    .steps h3 { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #92400e; }
    .steps ol { padding-left: 18px; }
    .steps li { margin-bottom: 6px; }
    .bridge-box { margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.4; }
  </style>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        var a = document.createElement('a');
        a.href = ${JSON.stringify(apkUrl)};
        a.download = ${JSON.stringify(targetApkName)};
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 500);
    });
  </script>
</head>
<body>
  <div class="box">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <img src="/pwa-192x192.png" alt="Logo Pro Loco" style="width:56px;height:56px;border-radius:14px;box-shadow:0 4px 12px rgba(6,78,59,0.2);flex-shrink:0;" />
      <div>
        <span class="tag" style="margin-bottom:4px;">INSTALLATORE UFFICIALE ANDROID (.APK) • v${CURRENT_APK_VERSION_NAME}</span>
        <h1 style="margin-bottom:2px;">${nomeProLoco}</h1>
        <p class="sub" style="margin-bottom:0;">Pacchetto Android Firmato V1+V2</p>
      </div>
    </div>

    <div class="socio-card">
      <div><strong>Destinatario:</strong> ${nomeSocio}</div>
      ${tessera ? `<div><strong>Numero Tessera:</strong> ${tessera}</div>` : ''}
      <div><strong>PIN di Accesso:</strong> ${pinSocio}</div>
    </div>

    <a class="btn-apk" href="${apkUrl}" download>1. Scarica File .APK (Consigliato)</a>
    <a class="btn-zip" href="${zipUrl}" download>Scarica Pacchetto .ZIP (Anti-blocco Email)</a>
    <a class="btn-web" href="${portalUrl}">2. Apri Subito Portale Web (Senza APK)</a>

    <div class="steps">
      <h3>Procedura di installazione sicura su Android:</h3>
      <ol>
        <li>Al termine del download tocca <strong>Apri</strong> sul file <strong>${targetApkName}</strong>.</li>
        <li>Se il telefono mostra <em>"Installazione bloccata da questa fonte"</em>, tocca <strong>Impostazioni</strong>, attiva <strong>"Consenti da questa fonte"</strong> e torna indietro toccando <strong>Installa</strong>.</li>
        <li>Se Google Play Protect mostra l'avviso di protezione per app fuori dallo Store, tocca <strong>"Più dettagli"</strong> e seleziona <strong>"Installa comunque"</strong>.</li>
      </ol>
    </div>

    <div class="bridge-box">
      <strong>Ponte Permanente Cloudflare configurato:</strong><br/>
      <a href="${bridgeApkUrl}" style="color:#2563eb;font-weight:700;word-break:break-all;text-decoration:underline;">
        ${bridgeApkUrl}
      </a>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  });

  // Link Corto Portale Socio: /s/2026-001
  app.get('/s/:tessera', (req, res) => {
    const rawT = String(req.params.tessera || '').trim();
    const normT = normalizeTesseraServer(rawT);
    const db = readDbFromDisk() || {};
    const socioDb =
      normT && Array.isArray(db.soci)
        ? db.soci.find((s: any) => normalizeTesseraServer(s.numeroTessera) === normT)
        : null;

    const t = encodeURIComponent(socioDb?.numeroTessera ? String(socioDb.numeroTessera).trim().toUpperCase() : rawT);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && k !== 's') {
        qs.set(k, String(v));
      }
    }
    if (!qs.has('pk') && !qs.has('pin') && !qs.has('p') && socioDb?.pin) {
      qs.set('pk', toBase64UrlNode(String(socioDb.pin).trim()));
    }
    const extra = qs.toString();
    res.redirect(302, `/?s=${t}${extra ? `&${extra}` : ''}`);
  });

  const distPath = path.join(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        watch: process.env.DISABLE_HMR === 'true' ? null : {
          ignored: ['**/.data/**', '**/proloco_db.json', '**/node_modules/**', '**/dist/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Pro Loco avviato su http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
    startCloudflareQuickTunnel(PORT).catch(() => {});
    startInternetAndTunnelWatcher(PORT);
  });
}

startServer();
