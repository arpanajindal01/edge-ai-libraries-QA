# ==============================================================================
# Copyright (C) 2018-2025 Intel Corporation
#
# SPDX-License-Identifier: MIT
# ==============================================================================

cmake_minimum_required(VERSION 3.20)

project(DL_Streamer C CXX)

if (WIN32)
    add_compile_options("$<$<C_COMPILER_ID:MSVC>:/utf-8>")
    add_compile_options("$<$<CXX_COMPILER_ID:MSVC>:/utf-8>")
endif()

if(NOT(UNIX) AND NOT(WIN32))
    message(FATAL_ERROR "Only UNIX and Windows supported")
endif()

if (NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
    message(STATUS "CMAKE_BUILD_TYPE is undefined. Set default build type ${CMAKE_BUILD_TYPE}.")
endif()

# Define version
set(VERSION_YEAR 2025)
set(VERSION_MAJOR 0)
set(VERSION_MINOR 1)
set(VERSION_PATCH 3)

if (NOT DEFINED GIT_INFO OR "${GIT_INFO}" STREQUAL "")
    set(GIT_INFO "0")
    message(INFO "GIT_INFO is undefined. Set default value ${GIT_INFO}.")
endif()

configure_file(cmake/version.txt.in version.txt)

set(PRODUCT_VERSION ${VERSION_YEAR}.${VERSION_MAJOR}.${VERSION_MINOR}.${VERSION_PATCH})
set(PLUGIN_VERSION ${PRODUCT_VERSION})

# Propagate version to plugins

add_definitions(-DPLUGIN_VERSION="${PLUGIN_VERSION}")
add_definitions(-DPACKAGE="dlstreamer")
add_definitions(-DPACKAGE_NAME="Intel® DL Streamer elements")
add_definitions(-DGST_PACKAGE_ORIGIN="https://github.com/open-edge-platform/edge-ai-libraries/tree/main/libraries/dl-streamer")
add_definitions(-DPLUGIN_LICENSE="MIT/X11")
add_definitions(-DPRODUCT_FULL_NAME="Intel® DL Streamer")

# Helper macros and functions

function (set_compile_flags TARGET)
    target_compile_options(${TARGET} PRIVATE $<$<COMPILE_LANGUAGE:C>:${C_FLAGS}> $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>)
    if (CMAKE_CXX_COMPILER STREQUAL "icpx")
        target_compile_options(${TARGET} PRIVATE -Wno-tautological-constant-compare)

        if (CMAKE_BUILD_TYPE STREQUAL "Debug")
            target_compile_options(${TARGET} PRIVATE -Wno-debug-disables-optimization -Rno-debug-disables-optimization -Wno-unknown-warning-option)
        endif()

        string(REPLACE "-fno-strict-overflow" "" CXX_TMP_FLAGS "${CMAKE_CXX_FLAGS}")
        set(CMAKE_CXX_FLAGS ${CXX_TMP_FLAGS} PARENT_SCOPE)
    endif()
endfunction(set_compile_flags)

# FIXME: replace with file(SIZE ...) when cmake version >= 3.14
function(file_size FILE SIZE)
    file(READ "${FILE}" CONTENT HEX)
    string(LENGTH "${CONTENT}" CONTENT_LENGTH)
    set(${SIZE} ${CONTENT_LENGTH} PARENT_SCOPE)
endfunction(file_size)

function(download_and_verify URL TARGET TARGET_NAME)
    if(NOT EXISTS ${TARGET})
        file(DOWNLOAD ${URL} ${TARGET} SHOW_PROGRESS STATUS DOWNLOAD_STATUS)
        list(GET DOWNLOAD_STATUS 0 RETURN_CODE)
        list(GET DOWNLOAD_STATUS 1 MESSAGE)
        if(NOT ${RETURN_CODE} EQUAL 0)
            file(REMOVE ${TARGET})
            message(FATAL_ERROR "Unable to download ${TARGET_NAME}: ${MESSAGE}")
        endif()
    endif()

    file_size(${TARGET} FILE_SIZE)
    if(${FILE_SIZE} EQUAL 0)
        file(REMOVE ${TARGET})
        message(FATAL_ERROR "Invalid ${TARGET_NAME} downloaded")
    endif()

    message(STATUS "Download of ${TARGET_NAME} is successful")
endfunction(download_and_verify)

# Set output paths
if (NOT(BIN_FOLDER))
    if("${CMAKE_SIZEOF_VOID_P}" EQUAL "8")
        set(BIN_FOLDER intel64)
    else()
        set(BIN_FOLDER ia32)
    endif()
endif()

set (CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BIN_FOLDER}/${CMAKE_BUILD_TYPE}/lib)
set (CMAKE_PLUGIN_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BIN_FOLDER}/${CMAKE_BUILD_TYPE}/lib/gstreamer-1.0)
set (CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BIN_FOLDER}/${CMAKE_BUILD_TYPE}/lib)
set (CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BIN_FOLDER}/${CMAKE_BUILD_TYPE}/bin)
set (CMAKE_SAMPLES_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/${BIN_FOLDER}/${CMAKE_BUILD_TYPE}/samples)

set (DLSTREAMER_LIBRARIES_INSTALL_PATH lib)
set (DLSTREAMER_PLUGINS_INSTALL_PATH ${DLSTREAMER_LIBRARIES_INSTALL_PATH}/gstreamer-1.0)
set (DLSTREAMER_HEADERS_INSTALL_PATH include)

# include and lib folders of this project
set (DLSTREAMER_BASE_DIR ${CMAKE_CURRENT_SOURCE_DIR})
set (DLSTREAMER_INCLUDE_DIRS ${DLSTREAMER_BASE_DIR}/include/dlstreamer)
set (DLSTREAMER_LIBRARIES ${CMAKE_LIBRARY_OUTPUT_DIRECTORY})

# Options

include(CMakeDependentOption)

option(ENABLE_SAMPLES "Parameter to enable samples building" ON)
cmake_dependent_option(TREAT_WARNING_AS_ERROR "Treat build warnings as errors" ON "UNIX" OFF)
cmake_dependent_option(ENABLE_ITT "Enable ITT for tracing" ON "UNIX AND NOT ${CMAKE_SYSTEM_PROCESSOR} STREQUAL aarch64" OFF)
cmake_dependent_option(ENABLE_VAAPI "Parameter to enable VAAPI for image pre-processing" ON "UNIX" ON)
cmake_dependent_option(ENABLE_PAHO_INSTALLATION "Enables paho-mqtt3c installation" OFF "UNIX" OFF)
cmake_dependent_option(ENABLE_TESTS "Parameter to enable tests building" ON "UNIX" OFF)
cmake_dependent_option(ENABLE_RDKAFKA_INSTALLATION "Enables rdkafka installation" OFF "UNIX" OFF)
option(ENABLE_AUDIO_INFERENCE_ELEMENTS "Enables audio inference elements" ON)
option(ENABLE_VPUX "Enables VPUX specific features" OFF)
option(ENABLE_GENAI "Enables GenAI elements" OFF)
message("ENABLE_PAHO_INSTALLATION=${ENABLE_PAHO_INSTALLATION}")
message("ENABLE_RDKAFKA_INSTALLATION=${ENABLE_RDKAFKA_INSTALLATION}")

# Define compiler flags

if(WIN32)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /permissive-")
    # disabled some warnings to reduce log size
    set(CMAKE_CXX_FLAGS_RELEASE "/O2 -wd4005 -wd4267 -wd4297 -wd4244 -wd4273 -wd4141 -wd4805")

    set (CMAKE_C_STANDARD 11)
    set (CMAKE_CXX_STANDARD 23)
else()
    # Common compilation flags
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wuninitialized -Winit-self -Wmaybe-uninitialized -Warray-bounds -fstack-protector-strong -Wno-deprecated-declarations -fno-strict-overflow -fno-delete-null-pointer-checks -fwrapv")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wuninitialized -Warray-bounds -fstack-protector-strong -Wno-deprecated-declarations -fno-strict-overflow -fno-delete-null-pointer-checks -fwrapv")

    if(TREAT_WARNING_AS_ERROR)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Werror")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Werror")
    endif()

    # Additional compilation flags aplied to specific targets
    set(C_FLAGS -Wall -Wextra)
    set(CXX_FLAGS -Wall -Wextra)

    set(CMAKE_CXX_FLAGS_RELEASE "-O2")
    if (${CMAKE_SYSTEM_PROCESSOR} STREQUAL "aarch64")
        # TODO: test if it increases x86 performance as well and rm check for aarch64
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -ftree-vectorize") # should be used with "-O2"
    endif()

    ## to use C11/C++17
    set (CMAKE_C_STANDARD 11)
    set (CMAKE_CXX_STANDARD 23)
    set (CMAKE_POSITION_INDEPENDENT_CODE ON)

    if (CMAKE_BUILD_TYPE STREQUAL "Release")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wformat -Wformat-security -Werror=format-security -z noexecstack -fPIE -pie -fPIC -D_FORTIFY_SOURCE=2 -Wl,-z,relro,-z,now -fstack-protector-strong")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wformat -Wformat-security -Werror=format-security -z noexecstack -fPIE -pie -fPIC -D_FORTIFY_SOURCE=2 -Wl,-z,relro,-z,now -fstack-protector-strong")
    else()
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wformat -Wformat-security -fPIE -pie -fPIC -D_FORTIFY_SOURCE=2 -fstack-protector")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wformat -Wformat-security -fPIE -pie -fPIC -D_FORTIFY_SOURCE=2 -fstack-protector")
    endif()

endif()

if(${ENABLE_AUDIO_INFERENCE_ELEMENTS})
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DAUDIO ")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DAUDIO ")
endif()

# Create config file

configure_file(cmake/config.h.in configs/config.h @ONLY)
include_directories(${CMAKE_CURRENT_BINARY_DIR}/configs)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DHAVE_CONFIG_H")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DHAVE_CONFIG_H")


# Find common packages

find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)

pkg_check_modules(GSTREAMER gstreamer-1.0>=1.16 REQUIRED)
link_directories(${GSTREAMER_LIBRARY_DIRS})

# Add subdirectories

add_subdirectory(include/dlstreamer)
add_subdirectory(include/dlstreamer/gst/videoanalytics)
add_subdirectory(src)
add_subdirectory(src/monolithic)
add_subdirectory(thirdparty)
add_subdirectory(python)

if(${ENABLE_SAMPLES})
    add_subdirectory(samples/gstreamer)
    #add_subdirectory(samples/ffmpeg_openvino/cpp/decode_inference)
    #add_subdirectory(samples/ffmpeg_openvino/cpp/decode_resize_inference)
    #add_subdirectory(samples/ffmpeg_dpcpp/rgb_to_grayscale)
endif()

if(${ENABLE_TESTS} AND NOT(WIN32))
    enable_testing()
    add_subdirectory(tests/unit_tests)
endif()
