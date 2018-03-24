extern crate chrono;
extern crate chrono_english;
extern crate libc;

use std::ffi::CStr;

use chrono::prelude::*;
use chrono_english::{parse_date_string, Dialect};
use libc::c_char;

/// Given a date string like "Next Wednesday at 5PM",
#[no_mangle]
pub extern "C" fn parse_english_date_string(ffi_date_string: *const c_char) -> i64 {
    let cstr = unsafe { CStr::from_ptr(ffi_date_string) };
    let date_str: &str = match cstr.to_str() {
        Ok(s) => s,
        Err(_) => {
            return 0;
        }
    };

    let date_time = match parse_date_string(date_str, Local::now(), Dialect::Us) {
        Ok(dt) => dt,
        Err(_) => {
            return 0;
        }
    };
    date_time.timestamp()
}
