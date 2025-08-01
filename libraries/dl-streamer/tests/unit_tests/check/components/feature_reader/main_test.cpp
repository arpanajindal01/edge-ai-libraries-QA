/*******************************************************************************
 * Copyright (C) 2020-2025 Intel Corporation
 *
 * SPDX-License-Identifier: MIT
 ******************************************************************************/

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <gst/check/gstcheck.h>

GTEST_API_ int main(int argc, char **argv) {
    std::cout << "Running Components::Feature_Reader_Test from " << __FILE__ << std::endl;
    testing::InitGoogleTest(&argc, argv);
    gst_check_init(&argc, &argv);
    return RUN_ALL_TESTS();
}