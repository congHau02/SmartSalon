package com.smartsalon.analytics.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class ReportExportServiceImplTest {

    @Test
    @DisplayName("buildFontHolder should fall back to standard Helvetica when font byte arrays are null or empty")
    void shouldFallbackToHelveticaWhenBytesMissingOrEmpty() throws IOException {
        ReportExportServiceImpl.FontHolder fontsNull = ReportExportServiceImpl.buildFontHolder(null, null);
        assertThat(fontsNull).isNotNull();
        assertThat(fontsNull.titleFont().getFamilyname()).containsIgnoringCase("Helvetica");

        ReportExportServiceImpl.FontHolder fontsEmpty = ReportExportServiceImpl.buildFontHolder(new byte[0], new byte[0]);
        assertThat(fontsEmpty).isNotNull();
        assertThat(fontsEmpty.titleFont().getFamilyname()).containsIgnoringCase("Helvetica");
    }
}
