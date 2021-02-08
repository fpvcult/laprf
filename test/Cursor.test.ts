/// <reference types="jest" />

import Cursor from '../src/Cursor';
import { u8, u16, u32, u64, f32, f64 } from '../src/Numbers';

let cursor: Cursor;

describe('Cursor Constructor', () => {
  test('creates a wrapped buffer with a ArrayBuffer argument', () => {
    cursor = new Cursor(new ArrayBuffer(64));
    expect(cursor.byteLength).toBe(64);
  });

  test('creates a wrapped buffer with a DataView argument', () => {
    cursor = new Cursor(new DataView(new ArrayBuffer(64)));
    expect(cursor.byteLength).toBe(64);
  });

  test('creates a wrapped buffer with a number argument', () => {
    cursor = new Cursor(64);
    expect(cursor.byteLength).toBe(64);
  });
});

describe('Cursor Write Functions', () => {
  describe('Big Endian', () => {
    beforeEach(() => {
      cursor = new Cursor(64);
      cursor.BE = true;
    });

    describe('Cursor#write u8 NumberType', () => {
      const value = 255;

      describe('Cursor#writeUint16', () => {
        beforeEach(() => cursor.writeUint8(value));
        testWriteUint8();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u8, value));
        testWriteUint8();
      });

      function testWriteUint8() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(1);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint8(0)).toBe(value);
        });
      }
    });

    describe('u16 NumberType', () => {
      const value = 65_535;

      describe('Cursor#writeUint16', () => {
        beforeEach(() => cursor.writeUint16(value));
        testWriteUint16();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u16, value));
        testWriteUint16();
      });

      function testWriteUint16() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(2);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint16(0)).toBe(value);
        });
      }
    });

    describe('Cursor#write u32 NumberType', () => {
      const value = 4_294_967_295;

      describe('Cursor#writeUint32', () => {
        beforeEach(() => cursor.writeUint32(value));
        testWriteUint32();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u32, value));
        testWriteUint32();
      });

      function testWriteUint32() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(4);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint32(0)).toBe(value);
        });
      }
    });

    describe('u64 NumberType', () => {
      const value = 4_294_967_295 + 1;

      describe('Cursor#writeUint64', () => {
        beforeEach(() => cursor.writeUint64(value));
        testWriteUint64();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u64, value));
        testWriteUint64();
      });

      function testWriteUint64() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(8);
        });
        test('contains the correct value', () => {
          expect(Number(cursor.view.getBigUint64(0))).toBe(value);
        });
      }
    });

    describe('f32 NumberType', () => {
      const value = 3.14;

      describe('Cursor#writeFloat32', () => {
        beforeEach(() => cursor.writeFloat32(value));
        testWriteFloat32();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(f32, value));
        testWriteFloat32();
      });

      function testWriteFloat32() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(4);
        });
        test('contains the correct value', () => {
          const expected = Math.round(value * 1000);
          const number = Math.round(cursor.view.getFloat32(0) * 1000);
          expect(number).toBe(expected);
        });
      }
    });

    describe('f64 NumberType', () => {
      const value = Math.PI;

      describe('Cursor#writeFloat64', () => {
        beforeEach(() => cursor.writeFloat64(value));
        testWriteFloat64();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(f64, value));
        testWriteFloat64();
      });

      function testWriteFloat64() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(8);
        });
        test('contains the correct value', () => {
          const number = cursor.view.getFloat64(0);
          expect(number).toBe(value);
        });
      }
    });
  });

  describe('Little Endian', () => {
    beforeEach(() => {
      cursor = new Cursor(64);
      cursor.LE = true;
    });

    describe('Cursor#write u8 NumberType', () => {
      const value = 255;

      describe('Cursor#writeUint16', () => {
        beforeEach(() => cursor.writeUint8(value));
        testWriteUint8();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u8, value));
        testWriteUint8();
      });

      function testWriteUint8() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(1);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint8(0)).toBe(value);
        });
      }
    });

    describe('u16 NumberType', () => {
      const value = 65_535;

      describe('Cursor#writeUint16', () => {
        beforeEach(() => cursor.writeUint16(value));
        testWriteUint16();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u16, value));
        testWriteUint16();
      });

      function testWriteUint16() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(2);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint16(0, true)).toBe(value);
        });
      }
    });

    describe('Cursor#write u32 NumberType', () => {
      const value = 4_294_967_295;

      describe('Cursor#writeUint32', () => {
        beforeEach(() => cursor.writeUint32(value));
        testWriteUint32();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u32, value));
        testWriteUint32();
      });

      function testWriteUint32() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(4);
        });
        test('contains the correct value', () => {
          expect(cursor.view.getUint32(0, true)).toBe(value);
        });
      }
    });

    describe('u64 NumberType', () => {
      const value = 2_147_483_648;

      describe('Cursor#writeUint64', () => {
        beforeEach(() => cursor.writeUint64(value));
        testWriteUint64();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(u64, value));
        testWriteUint64();
      });

      function testWriteUint64() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(8);
        });
        test('contains the correct value', () => {
          expect(Number(cursor.view.getBigUint64(0, true))).toBe(value);
        });
      }
    });

    describe('f32 NumberType', () => {
      const value = 3.14;

      describe('Cursor#writeFloat32', () => {
        beforeEach(() => cursor.writeFloat32(value));
        testWriteFloat32();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(f32, value));
        testWriteFloat32();
      });

      function testWriteFloat32() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(4);
        });
        test('contains the correct value', () => {
          const expected = Math.round(value * 1000);
          const number = Math.round(cursor.view.getFloat32(0, true) * 1000);
          expect(number).toBe(expected);
        });
      }
    });

    describe('f64 NumberType', () => {
      const value = Math.PI;

      describe('Cursor#writeFloat64', () => {
        beforeEach(() => cursor.writeFloat64(value));
        testWriteFloat64();
      });

      describe('Cursor#write', () => {
        beforeEach(() => cursor.write(f64, value));
        testWriteFloat64();
      });

      function testWriteFloat64() {
        test('increments the byte offset', () => {
          expect(cursor.position).toBe(8);
        });
        test('contains the correct value', () => {
          const number = cursor.view.getFloat64(0, true);
          expect(number).toBe(value);
        });
      }
    });
  });
});

// READ FUNCTIONS
describe('Cursor Read Functions', () => {
  describe('Big Endian', () => {
    beforeEach(() => {
      cursor = new Cursor(64);
      cursor.BE = true;
    });

    describe('u8 NumberType', () => {
      const value = 1;
      let result: number;

      beforeEach(() => cursor.view.setUint8(0, value));

      describe('Cursor#readUint8', () => {
        beforeEach(() => (result = cursor.readUint8()));
        testReadUint8();
      });

      describe('Cursor#read', () => {
        beforeEach(() => cursor.read(u8));
        testReadUint8();
      });

      function testReadUint8() {
        test('increments the byte offset', () => expect(cursor.position).toBe(1));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u16 NumberType', () => {
      const value = 256;
      let result: number;

      beforeEach(() => cursor.view.setUint16(0, value));

      describe('Cursor#readUint16', () => {
        beforeEach(() => (result = cursor.readUint16()));
        testReadUint16();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(u16)));
        testReadUint16();
      });

      function testReadUint16() {
        test('increments the byte offset', () => expect(cursor.position).toBe(2));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u32 NumberType', () => {
      const value = 65536;
      let result: number;

      beforeEach(() => cursor.view.setUint32(0, value));

      describe('Cursor#readUint32', () => {
        beforeEach(() => (result = cursor.readUint32()));
        testReadUint32();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(u32)));
        testReadUint32();
      });

      function testReadUint32() {
        test('increments the byte offset', () => expect(cursor.position).toBe(4));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u64 NumberType', () => {
      const value = 2_147_483_648;
      let result: number;

      beforeEach(() => cursor.view.setBigUint64(0, BigInt(value)));

      describe('Cursor#readUint64', () => {
        beforeEach(() => (result = cursor.readUint64()));
        testReadUint64();
      });

      describe('Curse#read', () => {
        beforeEach(() => (result = cursor.read(u64)));
        testReadUint64();
      });

      function testReadUint64() {
        test('increments the byte offset', () => expect(cursor.position).toBe(8));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('f32 NumberType', () => {
      const value = 3.14;
      let result: number;

      beforeEach(() => cursor.view.setFloat32(0, value));

      describe('Cursor#readFloat32', () => {
        beforeEach(() => (result = cursor.readFloat32()));
        testReadFloat32();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(f32)));
        testReadFloat32();
      });

      function testReadFloat32() {
        test('increments the byte offset', () => expect(cursor.position).toBe(4));
        test('contains the correct value', () => {
          expect(Math.round(result * 1000)).toBe(Math.round(value * 1000));
        });
      }
    });

    describe('f64 NumberType', () => {
      const value = Math.PI;
      let result: number;

      beforeEach(() => {
        cursor.view.setFloat64(0, value);
      });

      describe('Cursor#readFloat64', () => {
        beforeEach(() => (result = cursor.readFloat64()));
        testReadFloat64();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(f64)));
        testReadFloat64();
      });

      function testReadFloat64() {
        test('increments the byte offset', () => expect(cursor.position).toBe(8));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });
  });

  describe('Little Endian', () => {
    beforeEach(() => {
      cursor = new Cursor(64);
      cursor.LE = true;
    });

    describe('u8 NumberType', () => {
      const value = 1;
      let result: number;

      beforeEach(() => cursor.view.setUint8(0, value));

      describe('Cursor#readUint8', () => {
        beforeEach(() => (result = cursor.readUint8()));
        testReadUint8();
      });

      describe('Cursor#read', () => {
        beforeEach(() => cursor.read(u8));
        testReadUint8();
      });

      function testReadUint8() {
        test('increments the byte offset', () => expect(cursor.position).toBe(1));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u16 NumberType', () => {
      const value = 256;
      let result: number;

      beforeEach(() => cursor.view.setUint16(0, value, true));

      describe('Cursor#readUint16', () => {
        beforeEach(() => (result = cursor.readUint16()));
        testReadUint16();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(u16)));
        testReadUint16();
      });

      function testReadUint16() {
        test('increments the byte offset', () => expect(cursor.position).toBe(2));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u32 NumberType', () => {
      const value = 65536;
      let result: number;

      beforeEach(() => cursor.view.setUint32(0, value, true));

      describe('Cursor#readUint32', () => {
        beforeEach(() => (result = cursor.readUint32()));
        testReadUint32();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(u32)));
        testReadUint32();
      });

      function testReadUint32() {
        test('increments the byte offset', () => expect(cursor.position).toBe(4));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('u64 NumberType', () => {
      const value = 2_147_483_648;
      let result: number;

      beforeEach(() => cursor.view.setBigUint64(0, BigInt(value), true));

      describe('Cursor#readUint64', () => {
        beforeEach(() => (result = cursor.readUint64()));
        testReadUint64();
      });

      describe('Curse#read', () => {
        beforeEach(() => (result = cursor.read(u64)));
        testReadUint64();
      });

      function testReadUint64() {
        test('increments the byte offset', () => expect(cursor.position).toBe(8));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });

    describe('f32 NumberType', () => {
      const value = 3.14;
      let result: number;

      beforeEach(() => cursor.view.setFloat32(0, value, true));

      describe('Cursor#readFloat32', () => {
        beforeEach(() => (result = cursor.readFloat32()));
        testReadFloat32();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(f32)));
        testReadFloat32();
      });

      function testReadFloat32() {
        test('increments the byte offset', () => expect(cursor.position).toBe(4));
        test('contains the correct value', () => {
          expect(Math.round(result * 1000)).toBe(Math.round(value * 1000));
        });
      }
    });

    describe('f64 NumberType', () => {
      const value = Math.PI;
      let result: number;

      beforeEach(() => {
        cursor.view.setFloat64(0, value, true);
      });

      describe('Cursor#readFloat64', () => {
        beforeEach(() => (result = cursor.readFloat64()));
        testReadFloat64();
      });

      describe('Cursor#read', () => {
        beforeEach(() => (result = cursor.read(f64)));
        testReadFloat64();
      });

      function testReadFloat64() {
        test('increments the byte offset', () => expect(cursor.position).toBe(8));
        test('contains the correct value', () => expect(result).toBe(value));
      }
    });
  });
});
